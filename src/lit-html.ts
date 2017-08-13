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

// The first argument to JS template tags retain identity across multiple
// calls to a tag for the same literal, so we can cache work done per literal
// in a Map.
const templates = new Map<TemplateStringsArray, Template>();

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
export function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult {
  let template = templates.get(strings);
  if (template === undefined) {
    template = new Template(strings);
    templates.set(strings, template);
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
export function render(result: TemplateResult, container: Element|DocumentFragment,
    partCallback: PartCallback = defaultPartCallback) {
  let instance = (container as any).__templateInstance as any;

  // Repeat render, just call update()
  if (instance !== undefined &&
      instance.template === result.template &&
      instance._partCallback === partCallback) {
    instance.update(result.values);
    return;
  }

  // First render, create a new TemplateInstance and append it
  instance = new TemplateInstance(result.template, partCallback);
  (container as any).__templateInstance = instance;

  const fragment = instance._clone();
  instance.update(result.values);

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(fragment);
}

const exprMarker = '{{}}';

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
    public type: string,
    public index: number,
    public name?: string,
    public rawName?: string,
    public strings?: string[]) {
  }
}

export class Template {
  private _strings: TemplateStringsArray;
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

  constructor(strings: TemplateStringsArray) {
    this._strings = strings;
    this._parse();
  }

  private _parse() {
    this.element = document.createElement('template');
    this.element.innerHTML = this._getHtml(this._strings);
    const walker = document.createTreeWalker(this.element.content, 5 /* elements & text */);
    let index = -1;
    let partIndex = 0;
    const nodesToRemove = [];
    const attributesToRemove = [];
    while (walker.nextNode()) {
      index++;
      const node = walker.currentNode;
      if (node.nodeType === 1 /* ELEMENT_NODE */) {
        const attributes = node.attributes;
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes.item(i);
          const value = attribute.value;
          const strings = value.split(exprMarker);
          if (strings.length > 1) {
            const attributeString = this._strings[partIndex];
            // Trim the trailing literal value if this is an interpolation
            const rawNameString = attributeString.substring(0, attributeString.length - strings[0].length);
            const match = rawNameString.match(/((?:\w|[.\-_$])+)=["']?$/);
            const rawName = match![1];
            this.parts.push(new TemplatePart('attribute', index, attribute.name, rawName, strings));
            attributesToRemove.push(attribute);
            partIndex += strings.length - 1;
          }
        }
      } else if (node.nodeType === 3 /* TEXT_NODE */) {
        const strings = node.nodeValue!.split(exprMarker);
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
            parent.insertBefore(new Text(strings[i]), node);
            this.parts.push(new TemplatePart('node', index++));
          }
        } else if (!node.nodeValue!.trim()) {
          nodesToRemove.push(node);
          index--;
        }
      }
    }

    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode!.removeChild(n);
    }
    for (const a of attributesToRemove) {
      a.ownerElement.removeAttribute(a.name);
    }
  }

  private _getHtml(strings: TemplateStringsArray): string {
    const parts = [];
    for (let i = 0; i < strings.length; i++) {
      parts.push(strings[i]);
      if (i < strings.length - 1) {
        parts.push(exprMarker);
      }
    }
    return parts.join('');
  }

}

export type DirectiveFn = (part: Part) => any;

export const directive = <F extends DirectiveFn>(f: F): F => {
  (f as any).__litDirective = true;
  return f;
};

export abstract class Part {
  instance: TemplateInstance
  size?: number;

  constructor(instance: TemplateInstance) {
    this.instance = instance;
  }

  protected _getValue(value: any) {
    // `null` as the value of a Text node will render the string 'null'
    // so we convert it to undefined
    if (typeof value === 'function' && value.__litDirective === true) {
      value = value(this);
    }
    return value === null ? undefined : value;
  }
}

export interface SinglePart extends Part {
  setValue(value: any): void;
}

export interface MultiPart extends Part {
  setValue(values: any[], startIndex: number): void;
}

export class AttributePart extends Part implements MultiPart {
  element: Element;
  name: string;
  strings: string[];
  size: number;

  constructor(instance: TemplateInstance, element: Element, name: string, strings: string[]) {
    super(instance);
    console.assert(element.nodeType === 1 /* ELEMENT_NODE */);
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
        const v = this._getValue(values[startIndex + i]);
        if (v && typeof v !== 'string' && v[Symbol.iterator]) {
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

export class NodePart extends Part implements SinglePart {
  startNode: Node;
  endNode: Node;
  private _previousValue: any;

  constructor(instance: TemplateInstance, startNode: Node, endNode: Node) {
    super(instance);
    this.startNode = startNode;
    this.endNode = endNode;
  }

  setValue(value: any): void {
    value = this._getValue(value);

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
    } else if (value[Symbol.iterator]) {
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
    if (this.startNode.nextSibling! === this.endNode.previousSibling! &&
        this.startNode.nextSibling!.nodeType === Node.TEXT_NODE) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      // TODO(justinfagnani): Can we just check if _previousValue is
      // primitive?
      this.startNode.nextSibling!.textContent = value;
    } else {
      this._setNode(new Text(value));
    }
    this._previousValue = value;
  }

  private _setTemplateResult(value: TemplateResult): void {
    let instance: TemplateInstance;
    if (this._previousValue && this._previousValue.template === value.template) {
      instance = this._previousValue;
    } else {
      instance = new TemplateInstance(value.template, this.instance._partCallback);
      this._setNode(instance._clone());
      this._previousValue = instance;
    }
    instance.update(value.values);
  }

  private _setIterable(value: any): void {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and update Arrays of
    // TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`)

    // We reuse this parts startNode as the first part's startNode, and this
    // parts endNode as the last part's endNode.

    let itemStart = this.startNode;
    let itemEnd;
    const values = value[Symbol.iterator]() as Iterator<any>;

    const previousParts: NodePart[]|undefined = Array.isArray(this._previousValue) ?
        this._previousValue : undefined;
    let previousPartsIndex = 0;
    const itemParts = [];
    let current = values.next();
    let next = values.next();

    if (current.done) {
      // Empty iterable, just clear
      this.clear();
    }
    while (!current.done) {
      // Reuse a previous part if we can, otherwise create a new one
      let itemPart: NodePart;
      if (previousParts !== undefined && previousPartsIndex < previousParts.length) {
        itemPart = previousParts[previousPartsIndex++];
        if (next.done && itemPart.endNode !== this.endNode) {
          // Since this is the last part we'll use, set it's endNode to the
          // container's endNode. Setting the value of this part will clean
          // up any residual nodes from a previously longer iterable.

          // Remove previousSibling, since we want itemPart.endNode to be
          // removed as part of the clear operation.
          this.clear(itemPart.endNode.previousSibling!);
          itemPart.endNode = this.endNode;
        }
        itemEnd = itemPart.endNode;
      } else {
        if (next.done) {
          // on the last item, reuse this part's endNode
          itemEnd = this.endNode;
        } else {
          itemEnd = new Text();
          this._insert(itemEnd);
        }
        itemPart = new NodePart(this.instance, itemStart, itemEnd);
      }

      itemPart.setValue(current.value);
      itemParts.push(itemPart);

      current = next;
      next = values.next();
      itemStart = itemEnd;
    }
    this._previousValue = itemParts;
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
    this._previousValue = undefined;

    let node = startNode.nextSibling!;

    while (node !== null && node !== this.endNode) {
      let next = node.nextSibling!;
      node.parentNode!.removeChild(node);
      node = next;
    }
  }
}


export type PartCallback = (instance: TemplateInstance, templatePart: TemplatePart, node: Node) => Part;

export const defaultPartCallback = (instance: TemplateInstance, templatePart: TemplatePart, node: Node): Part => {
  if (templatePart.type === 'attribute') {
    return new AttributePart(instance, node as Element, templatePart.name!, templatePart.strings!);
  } else if (templatePart.type === 'node') {
    return new NodePart(instance, node, node.nextSibling!);
  }
  throw new Error(`Unknown part type ${templatePart.type}`);
}

/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
export class TemplateInstance {
  _parts: Part[] = [];
  _partCallback: PartCallback;
  template: Template;

  constructor(template: Template, partCallback: PartCallback = defaultPartCallback) {
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
      const walker = document.createTreeWalker(fragment, 5 /* elements & text */);

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
    return fragment;
  }

}
