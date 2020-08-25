/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// Added to an attribute name to mark the attribute as bound so we can find
// it easily.
const boundAttributeSuffix = '$lit$';

// This marker is used in many syntactic positions in HTML, so it must be
// a valid element name and attribute name. We don't support dynamic names (yet)
// but this at least ensures that the parse tree is closer to the template
// intention.
const marker = `lit$${String(Math.random()).slice(9)}$`;

// String used to tell if a comment is a marker comment
const markerMatch = '?' + marker;

// Text used to insert a comment marker node. We use processing instruction
// syntax because it's slightly smaller, but parses as a comment node.
const nodeMarker = `<${markerMatch}>`;

const d = document;

// Creates a dynamic marker. We never have to search for these in the DOM.
const createMarker = () => d.createComment('');

// https://tc39.github.io/ecma262/#sec-typeof-operator
type Primitive = null | undefined | boolean | number | string | symbol | bigint;
const isPrimitive = (value: unknown): value is Primitive =>
  value === null || typeof value != 'object' && typeof value != 'function';

/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * Matches the raw text elements.
 *
 * Comments are not parsed within raw text elements, so we need to search their
 * text content for marker strings.
 */
const rawTextElement = /script|style|textarea/i;

const HTML_RESULT = 1;
const SVG_RESULT = 2;

type ResultType = typeof HTML_RESULT | typeof SVG_RESULT;

/**
 * The return type of the template tag functions.
 */
export type TemplateResult = {
  _$litType$: ResultType;
  strings: TemplateStringsArray;
  values: unknown[];
};

/**
 * Generates a template literal tag function that returns a TemplateResult with
 * the given result type.
 */
const tag = (_$litType$: ResultType) => (
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult => ({
  _$litType$,
  strings,
  values,
});

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
export const html = tag(HTML_RESULT);

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
export const svg = tag(SVG_RESULT);

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
export const noChange = {};

/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
export const nothing = {};

/**
 * The cache of prepared templates, keyed by the tagged TemplateStringsArray
 * and _not_ accounting for the specific template tag used. This means that
 * template tags cannot be dynamic - the must statically be one of html, svg,
 * or attr. This restriction simplifies the cache lookup, which is on the hot
 * path for rendering.
 */
const templateCache = new Map<TemplateStringsArray, Template>();

export interface RenderOptions {
  /**
   * An object to use as the `this` value for event listeners. It's often
   * useful to set this to the host component rendering a template.
   */
  readonly eventContext?: EventTarget;
}

/**
 * Renders a value, usually a lit-html TemplateResult, to the container.
 * @param value
 * @param container
 * @param options
 */
export const render = (
  value: unknown,
  container: HTMLElement | DocumentFragment,
  options?: RenderOptions
) => {
  let part: NodePart = (container as any).$lit$;
  if (part === undefined) {
    const marker = createMarker();
    container.append(marker);
    (container as any).$lit$ = part = new NodePart(marker, null, options);
  }
  part.__setValue(value);
};

const walker = d.createTreeWalker(d);

class Template {
  private __strings: TemplateStringsArray;
  __element: HTMLTemplateElement;
  __parts: Array<TemplatePart> = [];

  constructor({strings, _$litType$: type}: TemplateResult) {
    this.__element = d.createElement('template');
    walker.currentNode = this.__element.content;

    // Insert makers into the template HTML to represent the position of
    // bindings. The following code scans the template strings to determine the
    // syntactic position of the bindings. They can be in text position, where
    // we insert an HTML comment, attribute value position, where we insert a
    // sentinel string and re-write the attribute name, or inside a tag where
    // we insert the sentinel string.
    const l = (this.__strings = strings).length - 1;

    // These regexes represent the five parsing states that we care about and
    // match the end of the state. Depending on the match, we transition to a
    // new state. If there's no match, we stay in the same state.
    // Note that the regexes are stateful. We utilize lastIndex and sync it
    // across the multiple regexes used. In addition to the five regexes below
    // we also dynamically create a regex to find the matching end tags for raw
    // text elements.

    const textRegex = /<(!--|\/?\w+|(\W|$))/g;
    const commentRegex = /-->/g;
    const tagRegex = /(>)|(?:(?:[ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*([^ \x09\x0a\x0c\x0d"'`<>=]|("|')|$)))/g;
    const singleQuoteAttr = /'/g;
    const doubleQuoteAttr = /"/g;

    let html = type === 2 ? '<svg>' : '';
    let quote: string | undefined;
    let node: Node | null;
    let nodeIndex = 0;
    let bindingIndex = 0;

    // The current parsing state, represented as a reference to one of the
    // regexes
    let regex = textRegex;

    for (let i = 0; i < strings.length - 1; i++) {
      const s = strings[i];
      // The index of the end of the last attribute. When this is !== -1 at
      // end of a string, it means we're in a quoted attribute position.
      let attrNameEnd = -1;
      let lastIndex = 0;

      // The conditions in this loop handle the current parse state, and the
      // assignments to the `regex` variable are the state transitions.
      while (lastIndex < s.length) {
        // Make sure we start searching from where we previously left off
        regex.lastIndex = lastIndex;
        const match = regex.exec(s);
        if (match === null) {
          // TODO (justfagnani): add test coverage from spread parts
          // If we're not in a quoted attribute value, make sure we clear
          // the attrNameEnd marker
          if (regex !== singleQuoteAttr && regex !== doubleQuoteAttr) {
            attrNameEnd = -1;
          }
          break;
        }
        lastIndex = regex.lastIndex;
        if (regex === textRegex) {
          // TODO (justinfagnani): there are more ways to open a comment in
          // HTML, like `<?` or `</{`. Figure out whether / how to handle that.
          if (match[1] === '!--') {
            regex = commentRegex;
          } else if (match[2] === undefined) {
            // If match[2] !== undefined, then we have an unescaped < and stay
            // in the text state
            if (rawTextElement.test(match[1])) {
              regex = new RegExp(`<\/${match[1]}`, 'g');
            } else {
              regex = tagRegex;
            }
          } else if (match[2] === '' || match[2] === '/') {
            // dynamic tag name
            regex = tagRegex;
          }
        } else if (regex === commentRegex) {
          regex = textRegex;
        } else if (
          regex === tagRegex ||
          regex === doubleQuoteAttr ||
          regex === singleQuoteAttr
        ) {
          if (match[1] === '>') {
            regex = textRegex;
          } else if (match[0] === quote) {
            // End quoted attribute
            attrNameEnd = -1;
            regex = tagRegex;
          } else {
            attrNameEnd = regex.lastIndex - match[3].length;
            quote = match[5];
            regex =
              quote === undefined
                ? tagRegex
                : quote === '"'
                ? doubleQuoteAttr
                : singleQuoteAttr;
          }
        } else {
          // Not one of the five state regexes, so it must be the dynamically
          // created raw text regex and we're at the close of that element.
          regex = tagRegex;
        }    
      }

      html +=
        regex === textRegex
          ? s + nodeMarker
          : (attrNameEnd === -1
              ? s
              : s.slice(0, attrNameEnd) + '$lit$' + s.slice(attrNameEnd)) +
            marker;
    }

    // TODO (justinfagnani): if regex is not textRegex log a warning for a
    // malformed template in dev mode.

    // Note, we don't add '</svg>' for SVG result types because the parser
    // will close the <svg> tag for us.
    this.__element.innerHTML = html + this.__strings[l];

    if (type === SVG_RESULT) {
      const content = this.__element.content;
      const svgElement = content.firstChild!;
      svgElement.remove();
      content.append(...svgElement.childNodes);
    }

    // Walk the template to find binding markers and create TemplateParts
    while ((node = walker.nextNode()) !== null && bindingIndex < l) {
      if (node.nodeType === 1) {
        if ((node as Element).hasAttributes()) {
          const {attributes} = node as Element;
          for (let i = 0; i < attributes.length; i++) {
            const {name, value} = attributes[i];
            if (name.endsWith(boundAttributeSuffix)) {
              i--;
              const statics = value.split(marker);
              (node as Element).removeAttribute(name);
              this.__parts.push({
                type: ATTRIBUTE_PART,
                index: nodeIndex,
                // TODO: remove this regex by storing the name during scanning
                name: lastAttributeNameRegex.exec(strings[bindingIndex])![2],
                strings: statics,
              });
              bindingIndex += statics.length - 1;
            } else if (name === marker) {
              (node as Element).removeAttribute(name);
              i--;
              this.__parts.push({
                type: ELEMENT_PART,
                index: nodeIndex,
              });
            }
          }
        }
        // TODO (justinfagnani): benchmark the regex against testing for each
        // of the 3 raw text element names.
        if (rawTextElement.test((node as Element).tagName)) {
          // For raw text elements we need to split the text content on
          // markers, create a Text node for each segment, and create
          // a TemplatePart for each marker.
          const strings = (node as Element).textContent!.split(marker);
          const lastIndex = strings.length - 1;
          if (lastIndex > 0) {
            (node as Element).textContent = '';
            // Generate a new text node for each literal section
            // These nodes are also used as the markers for node parts
            // We can't use empty text nodes as markers because they're
            // normalized in some browsers (TODO: check)
            for (let i = 0; i < lastIndex; i++) {
              (node as Element).append(strings[i] || createMarker());
              this.__parts.push({type: NODE_PART, index: ++nodeIndex});
              bindingIndex++;
            }
            (node as Element).append(strings[lastIndex] || createMarker());
          }
        }
      } else if (node.nodeType === 8) {
        const data = (node as Comment).data;
        if (data === markerMatch) {
          bindingIndex++;
          this.__parts.push({type: NODE_PART, index: nodeIndex});
        } else {
          let i = -1;
          while ((i = (node as Comment).data.indexOf(marker, i + 1)) !== -1) {
            // Comment node has a binding marker inside, make an inactive part
            // The binding won't work, but subsequent bindings will
            // TODO (justinfagnani): consider whether it's even worth it to
            // make bindings in comments work
            this.__parts.push({type: COMMENT_PART, index: nodeIndex});
            bindingIndex++;
            // Move to the end of the match
            i += marker.length - 1;
          }
        }
      }
      nodeIndex++;
    }
  }
}

/**
 * An updateable instance of a Template. Holds references to the Parts used to
 * update the template instance.
 */
class TemplateInstance {
  __template: Template;
  __parts: Array<Part | undefined> = [];

  constructor(template: Template) {
    this.__template = template;
  }

  // This method is separate from the constructor because we need to return a
  // DocumentFragment and we don't want to hold onto it with an instance field.
  __clone(options: RenderOptions | undefined) {
    const {
      __element: {content},
      __parts: parts,
    } = this.__template;
    const fragment = d.importNode(content, true);
    walker.currentNode = fragment;

    let node = walker.nextNode();
    let nodeIndex = 0;
    let partIndex = 0;
    let templatePart = parts[0];

    while (templatePart !== undefined && node !== null) {
      if (nodeIndex === templatePart.index) {
        let part: Part | undefined;
        if (templatePart.type === NODE_PART) {
          part = new NodePart(node as HTMLElement, node.nextSibling, options);
        } else {
          // TODO: other part types
        }
        this.__parts.push(part);
        templatePart = parts[++partIndex];
      }
      if (templatePart !== undefined && nodeIndex !== templatePart.index) {
        node = walker.nextNode();
        nodeIndex++;
      }
    }
    return fragment;
  }

  __update(values: Array<unknown>) {
    let i = 0;
    for (const part of this.__parts) {
      if (part === undefined) {
        i++;
        continue;
      }
      // TODO: other part types
      (part as NodePart).__setValue(values[i++]);
    }
  }
}

/*
 * Parts
 */

const ATTRIBUTE_PART = 1;
const NODE_PART = 2;
const ELEMENT_PART = 3;
const COMMENT_PART = 4;

type AttributeTemplatePart = {
  readonly type: typeof ATTRIBUTE_PART;
  index: number;
  readonly name: string;
  readonly strings: ReadonlyArray<string>;
};
type NodeTemplatePart = {
  readonly type: typeof NODE_PART;
  index: number;
};
type ElementTemplatePart = {
  readonly type: typeof ELEMENT_PART;
  index: number;
};
type CommentTemplatePart = {
  readonly type: typeof COMMENT_PART;
  index: number;
};

/**
 * A TemplatePart represents a dynamic part in a template, before the template
 * is instantiated. When a template is instantiated Parts are created from
 * TemplateParts.
 */
type TemplatePart =
  | NodeTemplatePart
  | AttributeTemplatePart
  | ElementTemplatePart
  | CommentTemplatePart;

export type Part = NodePart;

export class NodePart {
  __value: unknown;
  constructor(
    public __startNode: ChildNode,
    public __endNode: ChildNode | null,
    public options: RenderOptions | undefined
  ) {}

  __setValue(value: unknown): void {
    if (isPrimitive(value)) {
      if (value !== this.__value) {
        this.__commitText(value);
      }
    } else if ((value as TemplateResult)._$litType$ !== undefined) {
      this.__commitTemplateResult(value as TemplateResult);
    } else if ((value as Node).nodeType !== undefined) {
      this.__commitNode(value as Node);
    } else if (value === nothing) {
      this.__value = nothing;
      this.__clear();
    } else if (value !== noChange) {
      // Fallback, will render the string representation
      this.__commitText(value);
    }
  }

  private __insert(node: Node) {
    this.__startNode.parentNode!.insertBefore(node, this.__endNode);
  }

  private __commitNode(value: Node): void {
    if (this.__value === value) {
      return;
    }
    this.__clear();
    this.__insert(value);
    // For internal calls to __commitNode, this value is overwritten. Can we
    // avoid this?
    this.__value = value;
  }

  private __commitText(value: unknown): void {
    const node = this.__startNode.nextSibling;
    // If `value` isn't already a string, we explicitly convert it here in case
    // it can't be implicitly converted - i.e. it's a symbol.
    value = value == null ? '' : value;
    // TODO(justinfagnani): Can we just check if this.__value is primitive?
    if (
      node !== null &&
      node.nodeType === 3 /* Node.TEXT_NODE */ &&
      (this.__endNode === null
        ? node.nextSibling === null
        : node === this.__endNode.previousSibling)
    ) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      (node as Text).data = value as string;
    } else {
      this.__commitNode(new Text(value as string));
    }
    this.__value = value;
  }

  private __commitTemplateResult(result: TemplateResult): void {
    const {strings, values} = result;
    let template = templateCache.get(strings);
    if (template === undefined) {
      templateCache.set(strings, (template = new Template(result)));
    }
    if (
      this.__value != undefined &&
      (this.__value as TemplateInstance).__template === template
    ) {
      (this.__value as TemplateInstance).__update(values);
    } else {
      const instance = new TemplateInstance(template!);
      const fragment = instance.__clone(this.options);
      instance.__update(values);
      this.__commitNode(fragment);
      this.__value = instance;
    }
  }

  __clear(start: ChildNode | null = this.__startNode.nextSibling) {
    while (start && start !== this.__endNode) {
      const n = start!.nextSibling;
      start!.remove();
      start = n;
    }
  }
}

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
(
  (globalThis as any)['litHtmlVersions'] ||
  ((globalThis as any)['litHtmlVersions'] = [])
).push('1.3.0');
