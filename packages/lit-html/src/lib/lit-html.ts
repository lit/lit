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
  value === null || (typeof value != 'object' && typeof value != 'function');
const isArray = Array.isArray;
const isIterable = (value: unknown): value is Iterable<unknown> =>
  isArray(value) ||
  (value && typeof (value as any)[Symbol.iterator] === 'function');

// TODO (justinfagnani): can we get away with `\s`?
const SPACE_CHAR = `[ \t\n\f\r]`;
const ATTR_VALUE_CHAR = `[^ \t\n\f\r"'\`<>=]`;
const NAME_CHAR = `[^\0-\x1F\x7F-\x9F "'>=/]`;

// These regexes represent the five parsing states that we care about in the
// Template's HTML scanner. They match the *end* of the state they're named
// after.
// Depending on the match, we transition to a new state. If there's no match,
// we stay in the same state.
// Note that the regexes are stateful. We utilize lastIndex and sync it
// across the multiple regexes used. In addition to the five regexes below
// we also dynamically create a regex to find the matching end tags for raw
// text elements.

// TODO (justinfagnani): we detect many more parsing edge-cases than we
// used to, and many of those are of dubious value. Decide and document
// how to relax correctness to simplify the regexes and states.

/**
 * End of text is: `<` followed by:
 *   (comment start) or (tag) or (dynamic tag binding)
 */
const textRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
const commentRegex = /-->/g;
/**
 * Comments not started with <!--, like </{, can be ended by a single `>`
 */
const comment2Regex = />/g;

/**
 * The tagEnd regex matches the end of the "inside an opening" tag syntax
 * position. It either matches a `>` or an attribute.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \t\n\f\r" are HTML space characters:
 * https://infra.spec.whatwg.org/#ascii-whitespace
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
const tagRegex = new RegExp(
  `>|${SPACE_CHAR}(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|$))`,
  'g'
);
const singleQuoteAttr = /'/g;
const doubleQuoteAttr = /"/g;
/**
 * Matches the raw text elements.
 *
 * Comments are not parsed within raw text elements, so we need to search their
 * text content for marker strings.
 */
const rawTextElement = /^(?:script|style|textarea)$/i;

/** TemplateResult types */
const HTML_RESULT = 1;
const SVG_RESULT = 2;

/** TemplatePart types */
const ATTRIBUTE_PART = 1;
const NODE_PART = 2;
const ELEMENT_PART = 3;
const COMMENT_PART = 4;

type ResultType = typeof HTML_RESULT | typeof SVG_RESULT;

/**
 * The return type of the template tag functions.
 */
export type TemplateResult = {
  _$litType$: ResultType;
  // TODO (justinfagnani): consider shorter names, like `s` and `v`. This is a
  // semi-public API though. We can't just let Terser rename them for us,
  // because we need TemplateResults to work between compatible versions of
  // lit-html.
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
 * A sentinel value that signals to remove an item from a list.
 */
export const remove = {};

type InsertValue = {
  _$litInsert$: true;
  value: unknown;
};

/**
 * A wrapper that signals to insert a new value into a list, rather than write
 * over the current existing value.
 */
export const insert = (value: unknown): InsertValue => ({
  _$litInsert$: true,
  value,
});

/**
 * The cache of prepared templates, keyed by the tagged TemplateStringsArray
 * and _not_ accounting for the specific template tag used. This means that
 * template tags cannot be dynamic - the must statically be one of html, svg,
 * or attr. This restriction simplifies the cache lookup, which is on the hot
 * path for rendering.
 */
const templateCache = new Map<TemplateStringsArray, Template>();

export type DirectiveClass = {new (part: Part): Directive};

/**
 * This utility type extracts the signature of a directive class's render()
 * method so we can use it for the type of the generated directive function.
 */
type DirectiveProps<C extends DirectiveClass> = Parameters<
  InstanceType<C>['render']
>;

/**
 * A generated directive function doesn't evaluate the directive, but just
 * returns a DirectiveResult object that captures the arguments.
 */
type DirectiveResult<C extends DirectiveClass = DirectiveClass> = {
  _$litDirective$: C;
  values: DirectiveProps<C>;
};

/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 */
export const directive = <C extends DirectiveClass>(c: C) => (
  ...values: DirectiveProps<C>
): DirectiveResult<C> => ({
  _$litDirective$: c,
  values,
});

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

//
// Classes only below here, const variable declarations only above here...
//
// Keeping variable declarations and classes together improves minification.
// Interfaces and type aliases can be interleaved freely.
//

export abstract class Directive {
  abstract render(...props: Array<unknown>): unknown;
  update(_part: Part, props: Array<unknown>): unknown {
    return this.render(...props);
  }
}

class Template {
  private __strings: TemplateStringsArray;
  __element: HTMLTemplateElement;
  __parts: Array<TemplatePart> = [];

  constructor({strings, _$litType$: type}: TemplateResult) {
    walker.currentNode = (this.__element = d.createElement('template')).content;

    // Insert makers into the template HTML to represent the position of
    // bindings. The following code scans the template strings to determine the
    // syntactic position of the bindings. They can be in text position, where
    // we insert an HTML comment, attribute value position, where we insert a
    // sentinel string and re-write the attribute name, or inside a tag where
    // we insert the sentinel string.
    const l = (this.__strings = strings).length - 1;
    const attrNames: Array<string> = [];
    let html = type === SVG_RESULT ? '<svg>' : '';
    let node: Node | null;
    let nodeIndex = 0;
    let bindingIndex = 0;
    let attrNameIndex = 0;

    // The current parsing state, represented as a reference to one of the
    // regexes
    let regex = textRegex;

    for (let i = 0; i < l; i++) {
      const s = strings[i];
      // The index of the end of the last attribute. When this is !== -1 at
      // end of a string, it means we're in a quoted attribute position.
      let attrNameEnd = -1;
      let attrName: string | undefined;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      // The conditions in this loop handle the current parse state, and the
      // assignments to the `regex` variable are the state transitions.
      while (lastIndex < s.length) {
        // Make sure we start searching from where we previously left off
        regex.lastIndex = lastIndex;
        match = regex.exec(s);
        if (match === null) {
          // TODO (justinfagnani): add test coverage from spread parts
          // If we're not in a quoted attribute value, make sure we clear
          // the attrNameEnd marker
          if (regex !== singleQuoteAttr && regex !== doubleQuoteAttr) {
            attrNameEnd = -1;
          }
          break;
        }
        lastIndex = regex.lastIndex;
        if (regex === textRegex) {
          if (match[1] === '!--') {
            regex = commentRegex;
          } else if (match[1] !== undefined) {
            regex = comment2Regex;
          } else if (match[2] !== undefined) {
            if (rawTextElement.test(match[2])) {
              regex = new RegExp(`<\/${match[2]}`, 'g');
            } else {
              regex = tagRegex;
            }
          } else if (match[3] !== undefined) {
            // dynamic tag name
            regex = tagRegex;
          }
        } else if (regex === tagRegex) {
          if (match[0] === '>') {
            regex = textRegex;
          } else {
            attrNameEnd = regex.lastIndex - match[2].length;
            attrName = match[1];
            regex =
              match[3] === undefined
                ? tagRegex
                : match[3] === '"'
                ? doubleQuoteAttr
                : singleQuoteAttr;
          }
        } else if (regex === doubleQuoteAttr || regex === singleQuoteAttr) {
          attrNameEnd = -1;
          regex = tagRegex;
        } else if (regex === commentRegex || regex === comment2Regex) {
          regex = textRegex;
        } else {
          // Not one of the five state regexes, so it must be the dynamically
          // created raw text regex and we're at the close of that element.
          regex = tagRegex;
        }
      }

      // console.assert(!(attrNameEnd !== -1 && regex === textRegex));
      if (attrNameEnd !== -1) {
        attrNames.push(attrName!);
        html +=
          s.slice(0, attrNameEnd) + '$lit$' + s.slice(attrNameEnd) + marker;
      } else {
        html += regex === textRegex ? s + nodeMarker : s + marker;
      }
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
        // TODO (justinfagnani): for attempted dynamic tag names, we don't
        // increment the bindingIndex, and it'll be off by 1 in the element
        // and off by two after it.
        if ((node as Element).hasAttributes()) {
          const {attributes} = node as Element;
          for (let i = 0; i < attributes.length; i++) {
            const {name, value} = attributes[i];
            if (name.endsWith(boundAttributeSuffix)) {
              i--;
              (node as Element).removeAttribute(name);
              const statics = value.split(marker);
              const m = /([.?@])?(.*)/.exec(attrNames[attrNameIndex++])!;
              this.__parts.push({
                __type: ATTRIBUTE_PART,
                __index: nodeIndex,
                __name: m[2],
                __strings: statics,
                __constructor:
                  m[1] === '.'
                    ? PropertyPart
                    : m[1] === '?'
                    ? BooleanAttributePart
                    : m[1] === '@'
                    ? EventPart
                    : AttributePart,
              });
              bindingIndex += statics.length - 1;
            } else if (name === marker) {
              (node as Element).removeAttribute(name);
              i--;
              this.__parts.push({
                __type: ELEMENT_PART,
                __index: nodeIndex,
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
              this.__parts.push({__type: NODE_PART, __index: ++nodeIndex});
              bindingIndex++;
            }
            (node as Element).append(strings[lastIndex] || createMarker());
          }
        }
      } else if (node.nodeType === 8) {
        const data = (node as Comment).data;
        if (data === markerMatch) {
          bindingIndex++;
          this.__parts.push({__type: NODE_PART, __index: nodeIndex});
        } else {
          let i = -1;
          while ((i = (node as Comment).data.indexOf(marker, i + 1)) !== -1) {
            // Comment node has a binding marker inside, make an inactive part
            // The binding won't work, but subsequent bindings will
            // TODO (justinfagnani): consider whether it's even worth it to
            // make bindings in comments work
            this.__parts.push({__type: COMMENT_PART, __index: nodeIndex});
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
      if (nodeIndex === templatePart.__index) {
        let part: Part | undefined;
        if (templatePart.__type === NODE_PART) {
          part = new NodePart(node as HTMLElement, node.nextSibling, options);
        } else if (templatePart.__type === ATTRIBUTE_PART) {
          part = new templatePart.__constructor(
            node as HTMLElement,
            templatePart.__name,
            templatePart.__strings,
            options
          );
        }
        this.__parts.push(part);
        templatePart = parts[++partIndex];
      }
      if (templatePart !== undefined && nodeIndex !== templatePart.__index) {
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
      if ((part as AttributePart).__strings !== undefined) {
        (part as AttributePart).__setValue(values, i);
        i += (part as AttributePart).__strings!.length - 1;
      } else {
        (part as NodePart).__setValue(values[i++]);
      }
    }
  }
}

/*
 * Parts
 */
type AttributeTemplatePart = {
  readonly __type: typeof ATTRIBUTE_PART;
  readonly __index: number;
  readonly __name: string;
  readonly __constructor: typeof AttributePart;
  readonly __strings: ReadonlyArray<string>;
};
type NodeTemplatePart = {
  readonly __type: typeof NODE_PART;
  readonly __index: number;
};
type ElementTemplatePart = {
  readonly __type: typeof ELEMENT_PART;
  readonly __index: number;
};
type CommentTemplatePart = {
  readonly __type: typeof COMMENT_PART;
  readonly __index: number;
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

export type Part =
  | NodePart
  | AttributePart
  | PropertyPart
  | BooleanAttributePart;

/**
 * The state of a NodePart, which can be detached and reattached.
 */
export type NodePartState = {};

/**
 * The private interface for NodePartState, which should be kept opaque.
 */
type NodePartStateInternal = {
  __value: unknown;
  __fragment: DocumentFragment;
};

export class NodePart {
  __value: unknown;
  protected __directive?: Directive;

  constructor(
    public __startNode: ChildNode,
    public __endNode: ChildNode | null,
    public options: RenderOptions | undefined
  ) {}

  detach(): NodePartState {
    const fragment = document.createDocumentFragment();
    const state: NodePartStateInternal = {
      __value: this.__value,
      __fragment: fragment,
    };
    let start = this.__startNode.nextSibling;
    let nextNode;
    while (start !== this.__endNode) {
      nextNode = start!.nextSibling;
      fragment.append(start!);
      start = nextNode;
    }
    this.__value = nothing;
    return state;
  }

  restore(state: NodePartState) {
    this.__commitNode((state as NodePartStateInternal).__fragment);
    this.__value = (state as NodePartStateInternal).__value;
  }

  __setValue(value: unknown): void {
    if (isPrimitive(value)) {
      if (value !== this.__value) {
        this.__commitText(value);
      }
    } else if ((value as TemplateResult)._$litType$ !== undefined) {
      this.__commitTemplateResult(value as TemplateResult);
    } else if ((value as DirectiveResult)._$litDirective$ !== undefined) {
      this.__commitDirective(value as DirectiveResult);
    } else if ((value as Node).nodeType !== undefined) {
      this.__commitNode(value as Node);
    } else if (isIterable(value)) {
      this.__commitIterable(value);
    } else if (value === nothing) {
      this.__value = nothing;
      this.__clear();
    } else if (value !== noChange) {
      // Fallback, will render the string representation
      this.__commitText(value);
    }
  }

  private __insert<T extends Node>(node: T, ref = this.__endNode) {
    return this.__startNode.parentNode!.insertBefore(node, ref);
  }

  private __commitDirective(value: DirectiveResult) {
    const directive = value._$litDirective$;
    if (this.__directive?.constructor !== directive) {
      this.__clear();
      this.__directive = new directive(this);
    }
    // TODO (justinfagnani): To support nested directives, we'd need to
    // resolve the directive result's values. We may want to offer another
    // way of composing directives.
    this.__setValue(this.__directive.update(this, value.values));
  }

  private __commitNode(value: Node): void {
    if (this.__value !== value) {
      this.__clear();
      this.__value = this.__insert(value);
    }
  }

  private __commitText(value: unknown): void {
    const node = this.__startNode.nextSibling;
    // Make sure undefined and null render as an empty string
    // TODO: use `nothing` to clear the node?
    value ??= '';
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
      this.__value != null &&
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

  private __commitIterable(value: Iterable<unknown>): void {
    // For an Iterable, we create a new NodePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.

    // If value is an array, then the previous render was of an
    // iterable and value will contain the NodeParts from the previous
    // render. If value is not an array, clear this part and make a new
    // array for NodeParts.
    if (!isArray(this.__value)) {
      this.__value = [];
      this.__clear();
    }

    // Previous item parts. Lets us keep track of how many items we've stamped
    // so we can clear leftover items from a previous render
    const itemParts = this.__value as NodePart[];
    let partIndex = 0;
    let itemPart: NodePart | undefined;
    let marker: ChildNode;
    let previousMarker: ChildNode;
    let item: unknown;
    let insert;

    for (item of value) {
      // Try to reuse an existing part
      itemPart = itemParts[partIndex];

      if ((insert = (item as InsertValue)._$litInsert$ === true)) {
        item = (item as InsertValue).value;
      }

      // If no existing part, create a new one
      if (itemPart === undefined) {
        if (item === remove) {
          continue;
        }
        if (partIndex === 0) {
          // TODO (justinfagnani): use this.__startNode?
          this.__insert((previousMarker = createMarker()));
        }
        itemParts.push(
          (itemPart = new NodePart(
            previousMarker!,
            this.__insert(createMarker()),
            this.options
          ))
        );
      } else if (insert) {
        // Make an end marker for the new part. Insert it first because we need
        // to use it in __insert().
        // We try to use the start marker of the next part if there is one.
        marker =
          itemPart?.__startNode ??
          this.__insert(createMarker(), this.__startNode.nextSibling);
        itemParts.splice(
          partIndex,
          0,
          (itemPart = new NodePart(
            this.__insert(createMarker(), marker),
            marker,
            this.options
          ))
        );
      }
      if (item === remove) {
        itemPart!.__clear();
        if (previousMarker! === itemPart.__startNode) {
          itemParts[partIndex].__endNode = itemPart.__endNode;
        }
        itemPart.__startNode.remove();
      } else {
        itemPart.__setValue(item);
      }
      previousMarker = itemPart.__endNode as Comment;
      partIndex++;
    }

    if (partIndex < itemParts.length) {
      // Truncate the parts array so __value reflects the current state
      itemParts.length = partIndex;
      // itemParts always have end nodes
      this.__clear(itemPart?.__endNode!.nextSibling);
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

export class AttributePart {
  readonly __element: HTMLElement;
  readonly name: string;

  /**
   * If this attribute part represents an interpolation, this contains the
   * static strings of the interpolation. For single-value, complete bindings,
   * this is undefined.
   */
  readonly __strings?: ReadonlyArray<string>;
  __value: unknown | Array<unknown> = nothing;
  private __directives?: Array<Directive>;

  constructor(
    element: HTMLElement,
    name: string,
    strings: ReadonlyArray<string>,
    _options?: RenderOptions
  ) {
    this.__element = element;
    this.name = name;
    if (strings.length > 2 || strings[0] !== '' || strings[1] !== '') {
      this.__value = new Array(strings.length - 1).fill(nothing);
      this.__strings = strings;
    } else {
      this.__value = nothing;
    }
  }

  /**
   * Normalizes a user-provided value before writing it to the DOM. In the
   * near future this will include invoking a directive if the value is
   * a DirectiveResult.
   *
   * @param value the raw input value to normalize
   * @param _i the index in the values array this value was read from
   */
  __resolveValue(value: unknown, i: number) {
    const directiveCtor = (value as DirectiveResult)?._$litDirective$;
    if (directiveCtor !== undefined) {
      // TODO (justinfagnani): Initialize array to the correct value,
      // or check length.
      let directive: Directive = (this.__directives ??= [])[i];
      if (directive?.constructor !== directiveCtor) {
        directive = this.__directives[i] = new directiveCtor(this);
      }
      // TODO (justinfagnani): To support nested directives, we'd need to
      // resolve the directive result's values. We may want to offer another
      // way of composing directives.
      value = directive.update(this, (value as DirectiveResult).values);
    }
    return value ?? '';
  }

  /**
   * Sets the value of this part.
   *
   * If this part is single-valued, `this.__strings` will be undefined, and the
   * method will be called with a single value argument. If this part is
   * multi-value, `this.__strings` will be defined, and the method is called
   * with the value array of the part's owning TemplateInstance, and an offset
   * into the value array from which the values should be read.
   *
   * This method is overloaded this way to eliminate short-lived array slices
   * of the template instance values, and allow a fast-path for single-valued
   * parts.
   *
   * @param value The part value, or an array of values for multi-valued parts
   * @param from the index to start reading values from. `undefined` for
   *   single-valued parts
   */
  __setValue(value: unknown): void;
  __setValue(value: Array<unknown>, from: number): void;
  __setValue(value: unknown | Array<unknown>, from?: number) {
    const strings = this.__strings;

    if (strings === undefined) {
      // Single-value binding case
      const v = this.__resolveValue(value, 0);
      if (
        !((isPrimitive(v) || v === nothing) && v === this.__value) &&
        v !== noChange
      ) {
        this.__commitValue((this.__value = v));
      }
    } else {
      // Interpolation case
      let attributeValue = strings[0];

      // Whether any of the values has changed, for dirty-checking
      let change = false;

      // Whether any of the values is the `nothing` sentinel. If any are, we
      // remove the entire attribute.
      let remove = false;

      let i, v;
      for (i = 0; i < strings.length - 1; i++) {
        v = this.__resolveValue((value as Array<unknown>)[from! + i], i);
        if (v === noChange) {
          // If the user-provided value is `noChange`, use the previous value
          v = (this.__value as Array<unknown>)[i];
        } else {
          remove = remove || v === nothing;
          change =
            change ||
            !(
              (isPrimitive(v) || v === nothing) &&
              v === (this.__value as Array<unknown>)[i]
            );
          (this.__value as Array<unknown>)[i] = v;
        }
        attributeValue +=
          (typeof v === 'string' ? v : String(v)) + strings[i + 1];
      }
      if (change) {
        this.__commitValue(remove ? nothing : attributeValue);
      }
    }
  }

  /**
   * Writes the value to the DOM. An override point for PropertyPart and
   * BooleanAttributePart.
   */
  __commitValue(value: unknown) {
    if (value === nothing) {
      this.__element.removeAttribute(this.name);
    } else {
      this.__element.setAttribute(this.name, value as string);
    }
  }
}

export class PropertyPart extends AttributePart {
  __commitValue(value: unknown) {
    (this.__element as any)[this.name] = value === nothing ? undefined : value;
  }
}

export class BooleanAttributePart extends AttributePart {
  __commitValue(value: unknown) {
    if (value && value !== nothing) {
      this.__element.setAttribute(this.name, '');
    } else {
      this.__element.removeAttribute(this.name);
    }
  }
}

type EventListenerWithOptions = EventListenerOrEventListenerObject &
  Partial<AddEventListenerOptions>;

/**
 * An AttributePart that manages an event listener via add/removeEventListener.
 *
 * This part works by adding itself as the event listener on an element, then
 * delegating to the value passed to it. This reduces the number of calls to
 * add/removeEventListener if the listener changes frequently, such as when an
 * inline function is used as a listener.
 *
 * Because event options are passed when adding listeners, we must take case
 * to add and remove the part as a listener when the event options change.
 */
export class EventPart extends AttributePart {
  __eventContext?: unknown;

  constructor(...args: ConstructorParameters<typeof AttributePart>) {
    super(...args);
    this.__eventContext = args[3]?.eventContext;
  }

  __setValue(newListener: unknown) {
    newListener ??= nothing;
    const oldListener = this.__value;

    // If the new value is nothing or any options change we have to remove the
    // part as a listener.
    const shouldRemoveListener =
      (newListener === nothing && oldListener !== nothing) ||
      (newListener as EventListenerWithOptions).capture !==
        (oldListener as EventListenerWithOptions).capture ||
      (newListener as EventListenerWithOptions).once !==
        (oldListener as EventListenerWithOptions).once ||
      (newListener as EventListenerWithOptions).passive !==
        (oldListener as EventListenerWithOptions).passive;

    // If the new value is not nothing and we removed the listener, we have
    // to add the part as a listener.
    const shouldAddListener =
      newListener !== nothing &&
      (oldListener === nothing || shouldRemoveListener);

    if (shouldRemoveListener) {
      this.__element.removeEventListener(
        this.name,
        this,
        oldListener as EventListenerWithOptions
      );
    }
    if (shouldAddListener) {
      // Beware: IE11 and Chrome 41 don't like using the listener as the
      // options object. Figure out how to deal w/ this in IE11 - maybe
      // patch addEventListener?
      this.__element.addEventListener(
        this.name,
        this,
        newListener as EventListenerWithOptions
      );
    }
    this.__value = newListener;
  }

  handleEvent(event: Event) {
    if (typeof this.__value === 'function') {
      // TODO (justinfagnani): do we need to default to this.__element?
      // It'll always be the same as `e.currentTarget`.
      this.__value.call(this.__eventContext ?? this.__element, event);
    } else {
      (this.__value as EventListenerObject).handleEvent(event);
    }
  }
}

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
((globalThis as any)['litHtmlVersions'] ??= []).push('1.3.0');
