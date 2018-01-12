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

/**
 * TypeScript has a problem with precompiling templates literals
 * https://github.com/Microsoft/TypeScript/issues/17956
 *
 * TODO(justinfagnani): Run tests compiled to ES5 with both Babel and
 * TypeScript to verify correctness.
 */
const envCachesTemplates =
    ((t: any) => t() === t())(() => ((s: TemplateStringsArray) => s) ``);

// The first argument to JS template tags retain identity across multiple
// calls to a tag for the same literal, so we can cache work done per literal
// in a Map.
const templates = new Map<TemplateStringsArray|string, Template>();
const svgTemplates = new Map<TemplateStringsArray|string, Template>();

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    litTag(strings, values, templates, false);

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
    litTag(strings, values, svgTemplates, true);

function litTag(
    strings: TemplateStringsArray,
    values: any[],
    templates: Map<TemplateStringsArray|string, Template>,
    isSvg: boolean): TemplateResult {
  const key = envCachesTemplates ?
      strings :
      strings.join('{{--uniqueness-workaround--}}');
  let template = templates.get(key);
  if (template === undefined) {
    template = new Template(strings, isSvg);
    templates.set(key, template);
  }
  return new TemplateResult(template, values);
}

/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
export class TemplateResult {
  template: Template;
  values: any[];

  constructor(template: Template, values: any[]) {
    this.template = template;
    this.values = values;
  }
}

/**
 * Renders a template to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 */
export function render(
    result: TemplateResult,
    container: Element|DocumentFragment,
    partCallback: PartCallback = defaultPartCallback) {
  let instance = (container as any).__templateInstance as any;

  // Repeat render, just call update()
  if (instance !== undefined && instance.template === result.template &&
      instance._partCallback === partCallback) {
    instance.update(result.values);
    return;
  }

  // First render, create a new TemplateInstance and append it
  instance = new TemplateInstance(result.template, partCallback);
  (container as any).__templateInstance = instance;

  const fragment = instance._clone();
  instance.update(result.values);

  removeNodes(container, container.firstChild);
  container.appendChild(fragment);
}

/**
 * An expression marker with embedded unique key to avoid
 * https://github.com/PolymerLabs/lit-html/issues/62
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);

/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#attributes-0
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-character
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
const lastAttributeNameRegex =
    /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;

/**
 * Finds the closing index of the last closed HTML tag.
 * This has 3 possible return values:
 *   - `-1`, meaning there is no tag in str.
 *   - `string.length`, meaning the last opened tag is unclosed.
 *   - Some positive number < str.length, meaning the index of the closing '>'.
 */
function findTagClose(str: string): number {
  const close = str.lastIndexOf('>');
  const open = str.indexOf('<', close + 1);
  return open > -1 ? str.length : close;
}

/**
 * A placeholder for a dynamic expression in an HTML template.
 *
 * There are two built-in part types: AttributePart and NodePart. NodeParts
 * always represent a single dynamic expression, while AttributeParts may
 * represent as many expressions are contained in the attribute.
 *
 * A Template's parts are mutable, so parts can be replaced or modified
 * (possibly to implement different template semantics). The contract is that
 * parts can only be replaced, not removed, added or reordered, and parts must
 * always consume the correct number of values in their `update()` method.
 *
 * TODO(justinfagnani): That requirement is a little fragile. A
 * TemplateInstance could instead be more careful about which values it gives
 * to Part.update().
 */
export class TemplatePart {
  constructor(
      public type: string, public index: number, public name?: string,
      public rawName?: string, public strings?: string[]) {
  }
}


export class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

  constructor(strings: TemplateStringsArray, svg: boolean = false) {
    const element = this.element = document.createElement('template');
    element.innerHTML = this._getHtml(strings, svg);
    const content = element.content;

    if (svg) {
      const svgElement = content.firstChild!;
      content.removeChild(svgElement);
      reparentNodes(content, svgElement.firstChild);
    }

    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
        content,
        133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
               NodeFilter.SHOW_TEXT */
        ,
        null as any,
        false);
    let index = -1;
    let partIndex = 0;
    const nodesToRemove: Node[] = [];

    // The actual previous node, accounting for removals: if a node is removed
    // it will never be the previousNode.
    let previousNode: Node|undefined;
    // Used to set previousNode at the top of the loop.
    let currentNode: Node|undefined;

    while (walker.nextNode()) {
      index++;
      previousNode = currentNode;
      const node = currentNode = walker.currentNode as Element;
      if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
        if (!node.hasAttributes()) {
          continue;
        }
        const attributes = node.attributes;
        // Per https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
        // attributes are not guaranteed to be returned in document order. In
        // particular, Edge/IE can return them out of order, so we cannot assume
        // a correspondance between part index and attribute index.
        let count = 0;
        for (let i = 0; i < attributes.length; i++) {
          if (attributes[i].value.indexOf(marker) >= 0) {
            count++;
          }
        }
        while (count-- > 0) {
          // Get the template literal section leading up to the first
          // expression in this attribute attribute
          const stringForPart = strings[partIndex];
          // Find the attribute name
          const attributeNameInPart =
              lastAttributeNameRegex.exec(stringForPart)![1];
          // Find the corresponding attribute
          const attribute = attributes.getNamedItem(attributeNameInPart);
          const stringsForAttributeValue = attribute.value.split(markerRegex);
          this.parts.push(new TemplatePart(
              'attribute',
              index,
              attribute.name,
              attributeNameInPart,
              stringsForAttributeValue));
          node.removeAttribute(attribute.name);
          partIndex += stringsForAttributeValue.length - 1;
        }
      } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const nodeValue = node.nodeValue!;
        if (nodeValue.indexOf(marker) < 0) {
          continue;
        }

        const parent = node.parentNode!;
        const strings = nodeValue.split(markerRegex);
        const lastIndex = strings.length - 1;

        // We have a part for each match found
        partIndex += lastIndex;

        // We keep this current node, but reset its content to the last
        // literal part. We insert new literal nodes before this so that the
        // tree walker keeps its position correctly.
        node.textContent = strings[lastIndex];

        // Generate a new text node for each literal section
        // These nodes are also used as the markers for node parts
        for (let i = 0; i < lastIndex; i++) {
          parent.insertBefore(document.createTextNode(strings[i]), node);
          this.parts.push(new TemplatePart('node', index++));
        }
      } else if (
          node.nodeType === 8 /* Node.COMMENT_NODE */ &&
          node.nodeValue === marker) {
        const parent = node.parentNode!;
        // Add a new marker node to be the startNode of the Part if any of the
        // following are true:
        //  * We don't have a previousSibling
        //  * previousSibling is being removed (thus it's not the
        //    `previousNode`)
        //  * previousSibling is not a Text node
        //
        // TODO(justinfagnani): We should be able to use the previousNode here
        // as the marker node and reduce the number of extra nodes we add to a
        // template. See https://github.com/PolymerLabs/lit-html/issues/147
        const previousSibling = node.previousSibling;
        if (previousSibling === null || previousSibling !== previousNode ||
            previousSibling.nodeType !== Node.TEXT_NODE) {
          parent.insertBefore(document.createTextNode(''), node);
        } else {
          index--;
        }
        this.parts.push(new TemplatePart('node', index++));
        nodesToRemove.push(node);
        // If we don't have a nextSibling add a marker node.
        // We don't have to check if the next node is going to be removed,
        // because that node will induce a new marker if so.
        if (node.nextSibling === null) {
          parent.insertBefore(document.createTextNode(''), node);
        } else {
          index--;
        }
        currentNode = previousNode;
        partIndex++;
      }
    }

    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode!.removeChild(n);
    }
  }

  /**
   * Returns a string of HTML used to create a <template> element.
   */
  private _getHtml(strings: TemplateStringsArray, svg?: boolean): string {
    const l = strings.length - 1;
    let html = '';
    let isTextBinding = true;
    for (let i = 0; i < l; i++) {
      const s = strings[i];
      html += s;
      // We're in a text position if the previous string closed its tags.
      // If it doesn't have any tags, then we use the previous text position
      // state.
      const closing = findTagClose(s);
      isTextBinding = closing > -1 ? closing < s.length : isTextBinding;
      html += isTextBinding ? nodeMarker : marker;
    }
    html += strings[l];
    return svg ? `<svg>${html}</svg>` : html;
  }
}

/**
 * Returns a value ready to be inserted into a Part from a user-provided value.
 *
 * If the user value is a directive, this invokes the directive with the given
 * part. If the value is null, it's converted to undefined to work better
 * with certain DOM APIs, like textContent.
 */
export const getValue = (part: Part, value: any) => {
  // `null` as the value of a Text node will render the string 'null'
  // so we convert it to undefined
  if (isDirective(value)) {
    value = value(part);
    return directiveValue;
  }
  return value === null ? undefined : value;
};

export type DirectiveFn<P extends Part = Part> = (part: P) => any;

export const directive = <P extends Part = Part, F = DirectiveFn<P>>(f: F): F => {
  (f as any).__litDirective = true;
  return f;
};

const isDirective = (o: any) =>
    typeof o === 'function' && o.__litDirective === true;

const directiveValue = {};

export interface Part {
  instance: TemplateInstance;
  size?: number;
}

export interface SinglePart extends Part { setValue(value: any): void; }

export interface MultiPart extends Part {
  setValue(values: any[], startIndex: number): void;
}

export class AttributePart implements MultiPart {
  instance: TemplateInstance;
  element: Element;
  name: string;
  strings: string[];
  size: number;

  constructor(
      instance: TemplateInstance, element: Element, name: string,
      strings: string[]) {
    this.instance = instance;
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.size = strings.length - 1;
  }

  protected _interpolate(values: any[], startIndex: number) {
    const strings = this.strings;
    const l = strings.length - 1;
    let text = '';

    for (let i = 0; i < l; i++) {
      text += strings[i];
      const v = getValue(this, values[startIndex + i]);
      if (v && v !== directiveValue &&
          (Array.isArray(v) || typeof v !== 'string' && v[Symbol.iterator])) {
        for (const t of v) {
          // TODO: we need to recursively call getValue into iterables...
          text += t;
        }
      } else {
        text += v;
      }
    }
    return text + strings[l];
  }

  setValue(values: any[], startIndex: number): void {
    const text = this._interpolate(values, startIndex);
    this.element.setAttribute(this.name, text);
  }
}

export class NodePart implements SinglePart {
  instance: TemplateInstance;
  startNode: Node;
  endNode: Node;
  _previousValue: any;

  constructor(instance: TemplateInstance, startNode: Node, endNode: Node) {
    this.instance = instance;
    this.startNode = startNode;
    this.endNode = endNode;
    this._previousValue = undefined;
  }

  setValue(value: any): void {
    value = getValue(this, value);
    if (value === directiveValue) {
      return;
    }
    if (value === null ||
        !(typeof value === 'object' || typeof value === 'function')) {
      // Handle primitive values
      // If the value didn't change, do nothing
      if (value === this._previousValue) {
        return;
      }
      this._setText(value);
    } else if (value instanceof TemplateResult) {
      this._setTemplateResult(value);
    } else if (Array.isArray(value) || value[Symbol.iterator]) {
      this._setIterable(value);
    } else if (value instanceof Node) {
      this._setNode(value);
    } else if (value.then !== undefined) {
      this._setPromise(value);
    } else {
      // Fallback, will render the string representation
      this._setText(value);
    }
  }

  private _insert(node: Node) {
    this.endNode.parentNode!.insertBefore(node, this.endNode);
  }

  private _setNode(value: Node): void {
    if (this._previousValue === value) {
      return;
    }
    this.clear();
    this._insert(value);
    this._previousValue = value;
  }

  private _setText(value: string): void {
    const node = this.startNode.nextSibling!;
    value = value === undefined ? '' : value;
    if (node === this.endNode.previousSibling &&
        node.nodeType === Node.TEXT_NODE) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      // TODO(justinfagnani): Can we just check if _previousValue is
      // primitive?
      node.textContent = value;
    } else {
      this._setNode(document.createTextNode(value));
    }
    this._previousValue = value;
  }

  private _setTemplateResult(value: TemplateResult): void {
    let instance: TemplateInstance;
    if (this._previousValue &&
        this._previousValue.template === value.template) {
      instance = this._previousValue;
    } else {
      instance =
          new TemplateInstance(value.template, this.instance._partCallback);
      this._setNode(instance._clone());
      this._previousValue = instance;
    }
    instance.update(value.values);
  }

  private _setIterable(value: any): void {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.

    // If _previousValue is an array, then the previous render was of an
    // iterable and _previousValue will contain the NodeParts from the previous
    // render. If _previousValue is not an array, clear this part and make a new
    // array for NodeParts.
    if (!Array.isArray(this._previousValue)) {
      this.clear();
      this._previousValue = [];
    }

    // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render
    const itemParts = this._previousValue as any[];
    let partIndex = 0;

    for (const item of value) {
      // Try to reuse an existing part
      let itemPart = itemParts[partIndex];

      // If no existing part, create a new one
      if (itemPart === undefined) {
        // If we're creating the first item part, it's startNode should be the
        // container's startNode
        let itemStart = this.startNode;

        // If we're not creating the first part, create a new separator marker
        // node, and fix up the previous part's endNode to point to it
        if (partIndex > 0) {
          const previousPart = itemParts[partIndex - 1];
          itemStart = previousPart.endNode = document.createTextNode('');
          this._insert(itemStart);
        }
        itemPart = new NodePart(this.instance, itemStart, this.endNode);
        itemParts.push(itemPart);
      }
      itemPart.setValue(item);
      partIndex++;
    }

    if (partIndex === 0) {
      this.clear();
      this._previousValue = undefined;
    } else if (partIndex < itemParts.length) {
      const lastPart = itemParts[partIndex - 1];
      // Truncate the parts array so _previousValue reflects the current state
      itemParts.length = partIndex;
      this.clear(lastPart.endNode.previousSibling!);
      lastPart.endNode = this.endNode;
    }
  }

  private _setPromise(value: Promise<any>): void {
    this._previousValue = value;
    value.then((v: any) => {
      if (this._previousValue === value) {
        this.setValue(v);
      }
    });
  }

  clear(startNode: Node = this.startNode) {
    removeNodes(
        this.startNode.parentNode!, startNode.nextSibling!, this.endNode);
  }
}

export type PartCallback =
    (instance: TemplateInstance, templatePart: TemplatePart, node: Node) =>
        Part;

export const defaultPartCallback =
    (instance: TemplateInstance,
     templatePart: TemplatePart,
     node: Node): Part => {
      if (templatePart.type === 'attribute') {
        return new AttributePart(
            instance, node as Element, templatePart.name!, templatePart.strings!
        );
      } else if (templatePart.type === 'node') {
        return new NodePart(instance, node, node.nextSibling!);
      }
      throw new Error(`Unknown part type ${templatePart.type}`);
    };

/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
export class TemplateInstance {
  _parts: Part[] = [];
  _partCallback: PartCallback;
  template: Template;

  constructor(
      template: Template, partCallback: PartCallback = defaultPartCallback) {
    this.template = template;
    this._partCallback = partCallback;
  }

  update(values: any[]) {
    let valueIndex = 0;
    for (const part of this._parts) {
      if (part.size === undefined) {
        (part as SinglePart).setValue(values[valueIndex]);
        valueIndex++;
      } else {
        (part as MultiPart).setValue(values, valueIndex);
        valueIndex += part.size;
      }
    }
  }

  _clone(): DocumentFragment {
    const fragment = document.importNode(this.template.element.content, true);
    const parts = this.template.parts;

    if (parts.length > 0) {
      // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null
      const walker = document.createTreeWalker(
          fragment,
          133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                 NodeFilter.SHOW_TEXT */
          ,
          null as any,
          false);

      let index = -1;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        while (index < part.index) {
          index++;
          walker.nextNode();
        }
        this._parts.push(this._partCallback(this, part, walker.currentNode));
      }
    }
    return fragment;
  }
}

/**
 * Reparents nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), into another container (could be the same container), before
 * `beforeNode`. If `beforeNode` is null, it appends the nodes to the
 * container.
 */
export const reparentNodes =
    (container: Node,
     start: Node | null,
     end: Node | null = null,
     before: Node | null = null): void => {
      let node = start;
      while (node !== end) {
        const n = node!.nextSibling;
        container.insertBefore(node!, before as Node);
        node = n;
      }
    };

/**
 * Removes nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), from `container`.
 */
export const removeNodes =
    (container: Node, startNode: Node | null, endNode: Node | null = null):
        void => {
          let node = startNode;
          while (node !== endNode) {
            const n = node!.nextSibling;
            container.removeChild(node!);
            node = n;
          }
        };
