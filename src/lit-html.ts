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

  let child;
  while ((child = container.lastChild)) {
    container.removeChild(child);
  }
  container.appendChild(fragment);
}

/**
 * An expression marker with embedded unique key to avoid
 * https://github.com/PolymerLabs/lit-html/issues/62
 */
const attributeMarker = `{{lit-${Math.random()}}}`;

/**
 * Regex to scan the string preceding an expression to see if we're in a text
 * context, and not an attribute context.
 *
 * This works by seeing if we have a `>` not followed by a `<`. If there is a
 * `<` closer to the end of the strings, then we're inside a tag.
 */
const textRegex = />[^<]*$/;
const hasTagsRegex = /[^<]*/;
const textMarkerContent = '_-lit-html-_';
const textMarker = `<!--${textMarkerContent}-->`;
const attrOrTextRegex = new RegExp(`${attributeMarker}|${textMarker}`);

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
  svg: boolean;

  constructor(strings: TemplateStringsArray, svg: boolean = false) {
    this.svg = svg;
    this.element = document.createElement('template');
    this.element.innerHTML = this._getHtml(strings, svg);
    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
        this.element.content,
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
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes.item(i);
          const attributeStrings = attribute.value.split(attrOrTextRegex);
          if (attributeStrings.length > 1) {
            // Get the template literal section leading up to the first
            // expression in this attribute attribute
            const attributeString = strings[partIndex];
            // Trim the trailing literal value if this is an interpolation
            const rawNameString = attributeString.substring(
                0, attributeString.length - attributeStrings[0].length);
            // Find the attribute name
            const rawName = rawNameString.match(/((?:\w|[.\-_$])+)=["']?$/)![1];
            this.parts.push(new TemplatePart(
                'attribute', index, attribute.name, rawName, attributeStrings));
            node.removeAttribute(attribute.name);
            partIndex += attributeStrings.length - 1;
            i--;
          }
        }
      } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const nodeValue = node.nodeValue!;
        const strings = nodeValue.split(attributeMarker);
        if (strings.length > 1) {
          const parent = node.parentNode!;
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
        } else {
          // Strip whitespace-only nodes, only between elements, or at the
          // beginning or end of elements.
          const previousSibling = node.previousSibling;
          const nextSibling = node.nextSibling;
          if ((previousSibling === null ||
               previousSibling.nodeType === 1 /* Node.ELEMENT_NODE */) &&
              (nextSibling === null ||
               nextSibling.nodeType === 1 /* Node.ELEMENT_NODE */) &&
              nodeValue.trim() === '') {
            nodesToRemove.push(node);
            currentNode = previousNode;
            index--;
          }
        }
      } else if (
          node.nodeType === 8 /* Node.COMMENT_NODE */ &&
          node.nodeValue === textMarkerContent) {
        const parent = node.parentNode!;
        // If we don't have a previous node add a marker node.
        // If the previousSibling is removed, because it's another part
        // placholder, or empty text, add a marker node.
        if (node.previousSibling === null ||
            node.previousSibling !== previousNode) {
          parent.insertBefore(new Text(), node);
        } else {
          index--;
        }
        this.parts.push(new TemplatePart('node', index++));
        nodesToRemove.push(node);
        // If we don't have a next node add a marker node.
        // We don't have to check if the next node is going to be removed,
        // because that node will induce a marker if so.
        if (node.nextSibling === null) {
          parent.insertBefore(new Text(), node);
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
    const l = strings.length;
    const a = [];
    let isTextBinding = false;
    for (let i = 0; i < l - 1; i++) {
      const s = strings[i];
      a.push(s);
      // We're in a text position if the previous string matches the
      // textRegex. If it doesn't and the previous string has no tags, then
      // we use the previous text position state.
      isTextBinding = s.match(textRegex) !== null ||
          (s.match(hasTagsRegex) !== null && isTextBinding);
      a.push(isTextBinding ? textMarker : attributeMarker);
    }
    a.push(strings[l - 1]);
    const html = a.join('');
    return svg ? `<svg>${html}</svg>` : html;
  }
}

export const getValue = (part: Part, value: any) => {
  // `null` as the value of a Text node will render the string 'null'
  // so we convert it to undefined
  if (value != null && value.__litDirective === true) {
    value = value(part);
  }
  return value === null ? undefined : value;
};

export type DirectiveFn = (part: Part) => any;

export const directive = <F extends DirectiveFn>(f: F): F => {
  (f as any).__litDirective = true;
  return f;
};

export interface Part {
  instance: TemplateInstance;
  size?: number;

  // constructor(instance: TemplateInstance) {
  //   this.instance = instance;
  // }
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

  setValue(values: any[], startIndex: number): void {
    const strings = this.strings;
    let text = '';

    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < strings.length - 1) {
        const v = getValue(this, values[startIndex + i]);
        if (v &&
            (Array.isArray(v) || typeof v !== 'string' && v[Symbol.iterator])) {
          for (const t of v) {
            // TODO: we need to recursively call getValue into iterables...
            text += t;
          }
        } else {
          text += v;
        }
      }
    }
    this.element.setAttribute(this.name, text);
  }
}

export class NodePart implements SinglePart {
  instance: TemplateInstance;
  startNode: Node;
  endNode: Node;
  private _previousValue: any;

  constructor(instance: TemplateInstance, startNode: Node, endNode: Node) {
    this.instance = instance;
    this.startNode = startNode;
    this.endNode = endNode;
    this._previousValue = undefined;
  }

  setValue(value: any): void {
    value = getValue(this, value);

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
    this.clear();
    this._insert(value);
    this._previousValue = value;
  }

  private _setText(value: string): void {
    const node = this.startNode.nextSibling!;
    if (node === this.endNode.previousSibling &&
        node.nodeType === Node.TEXT_NODE) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      // TODO(justinfagnani): Can we just check if _previousValue is
      // primitive?
      node.textContent = value;
    } else {
      this._setNode(document.createTextNode(value === undefined ? '' : value));
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

  protected _setPromise(value: Promise<any>): void {
    value.then((v: any) => {
      if (this._previousValue === value) {
        this.setValue(v);
      }
    });
    this._previousValue = value;
  }

  clear(startNode: Node = this.startNode) {
    let node;
    while ((node = startNode.nextSibling!) !== this.endNode) {
      node.parentNode!.removeChild(node);
    }
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

    if (this.template.parts.length > 0) {
      // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null
      const walker = document.createTreeWalker(
          fragment,
          133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT */
          ,
          null as any,
          false);

      const parts = this.template.parts;
      let index = 0;
      let partIndex = 0;
      let templatePart = parts[0];
      let node = walker.nextNode();
      while (node != null && partIndex < parts.length) {
        if (index === templatePart.index) {
          this._parts.push(this._partCallback(this, templatePart, node));
          templatePart = parts[++partIndex];
        } else {
          index++;
          node = walker.nextNode();
        }
      }
    }
    if (this.template.svg) {
      const svgElement = fragment.firstChild!;
      fragment.removeChild(svgElement);
      const nodes = svgElement.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        fragment.appendChild(nodes.item(i));
      }
    }
    return fragment;
  }
}
