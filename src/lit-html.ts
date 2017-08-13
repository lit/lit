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
export function render(result: TemplateResult, container: Element|DocumentFragment) {
  let instance = (container as any).__templateInstance as any;
  if (instance !== undefined &&
      instance.template === result.template &&
      instance instanceof TemplateInstance) {
    instance.update(result.values);
    return;
  }

  instance = new TemplateInstance(result.template);
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
    public path: number[],
    public name?: string,
    public rawName?: string,
    public strings?: string[]) {
  }
}

export class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

  constructor(strings: TemplateStringsArray) {
    this.element = document.createElement('template');
    this.element.innerHTML = this._getHtml(strings);

    const nodesToRemove: Node[] = [];
    const attributesToRemove: Attr[] = [];

    // The current location in the DOM tree, as an array of child indices
    const currentPath: number[] = [];

    // What expression we're currently handling
    let expressionIndex = 0;

    /*
     * This populates the parts array by traversing the template with a
     * recursive DFS, and giving each part a path of indices from the root of
     * the template to the target node.
     */
    const findParts = (node: Node, index: number) => {
      currentPath.push(index);
      let size = 1;
      if (node.nodeType === 3 /* TEXT_NODE */) {
        const value = node.nodeValue!;
        const strings = value!.split(exprMarker);
        if (strings.length > 1) {
          const parent = node.parentNode!;
          size = strings.length;
          const lastIndex = size - 1;

          // We have a part for each match found
          expressionIndex += lastIndex;

          // We keep this current node, but reset its content to the last
          // literal part. We insert new literal nodes before this so that the
          // tree walker keeps its position correctly.
          node.textContent = strings[lastIndex];

          // Generate a new text node for each literal section
          // These nodes are also used as the markers for node parts
          for (let i = 0; i < lastIndex; i++) {
            parent.insertBefore(new Text(strings[i]), node);
            this.parts.push(new TemplatePart('node', currentPath.slice(1)));
            // Increment the last index on the stack because we just created a
            // new text node
            currentPath[currentPath.length - 1] += 1;
          }
        } else if (value.trim() === '') {
          nodesToRemove.push(node);
          size = 0;
        }
      } else { /* ELEMENT_NODE or DOCUMENT_FRAGMENT */
        if (node.nodeType === 1 && node.hasAttributes()) {
          const attributes = node.attributes;
          for (let i = 0; i < attributes.length; i++) {
            const attribute = attributes.item(i);
            const value = attribute.value;

            // Look for expression markers
            const attributeStrings = value.split(exprMarker);
            if (attributeStrings.length > 1) {
              // Get the template string that preced this attribute expression
              const attributeString = strings[expressionIndex];
              // Trim the trailing literal part of the attribute value if this
              // is an interpolation
              const rawNameString = attributeString.substring(0, attributeString.length - attributeStrings[0].length);
              // Extract the attribute name
              const match = rawNameString.match(/((?:\w|[.\-_$])+)=["']?$/);
              const rawName = match![1];
              this.parts.push(new TemplatePart('attribute', currentPath.slice(1), attribute.name, rawName, attributeStrings));
              attributesToRemove.push(attribute);
              expressionIndex += attributeStrings.length - 1;
            }
          }
        }
        if (node.hasChildNodes()) {
          let child = node.firstChild;
          let i = 0;
          while (child !== null) {
            i += findParts(child, i);
            child = child.nextSibling;
          }
        }
      }
      currentPath.pop();
      return size;
    }
    findParts(this.element.content, -1);

    // Remove empty text nodes and attributes after the walk so as to not
    // disturb the traversal
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
      instance = this.instance._createInstance(value.template);
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

export class TemplateInstance {
  _parts: Part[] = [];
  template: Template;
  startNode: Node;
  endNode: Node;

  constructor(template: Template) {
    this.template = template;
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

    /*
     * This implements a search that traverses the minimum number of Nodes in a
     * DOM tree while only using Node.firstChild and Node.nextSibling, which
     * have been measured to be faster than accessing Node.childNodes.
     * 
     * For any given path of childNode indices starting from the root of the
     * template, we recursively find the parent, then call nextSibling until
     * we get to the target index.
     * 
     * Once found, we cache the index and node, so that the next lookup can be
     * faster by:
     * 
     *  1. Finding the common ancestor of the previously searched path
     *  2. Starting a traversal of children from that common ancestor from the
     *     last node found, rather than firstChild
     * 
     * This means that any node is only ever visited once.
     * 
     * In order for this to work, paths much be searched for in depth-first
     * order.
     * 
     * The overhead of these optimizations probably only matters for larger,
     * more complex templates, with enough bindings to speard search costs
     * across them, and the benefit will not show up on micro-bencharks with
     * small templates. However, it doesn't seem like this slows down
     * micro-benchmarks.
     */
    let nodeStack: [number, Node][] = [];
    const findNodeAtPath = (path: number[], depth: number): Node|undefined => {
      // Recurse up the tree to find the parent
      const parent = (depth === 0) ? fragment : findNodeAtPath(path, depth - 1)!;

      // The target index we're searching for at this depth
      const targetIndex = path[depth];
      let currentIndex;
      let node;

      if (nodeStack.length > depth) {
        // If we've cached up to this depth, and the index in the stack at this
        // depth equals the targetIndex, then just return from the stack.
        if (nodeStack[depth][0] === targetIndex) {
          return nodeStack[depth][1];
        }

        // Otherwise, start the search at the last index we used at this level
        [currentIndex, node] = nodeStack[depth]
        nodeStack = nodeStack.slice(0, depth);
      } else {
        // If the stack didn't have anything at this depth, initialize the search
        // to the first child
        currentIndex = 0;
        node = parent.firstChild;
      }

      // Perform the traversal
      while (node !== null) {
        if (currentIndex === targetIndex) {
          // When we have a hit, cache it
          nodeStack.push([currentIndex, node]);
          return node;
        }
        node = node.nextSibling;
        currentIndex++;
      }
      // This should never happen
      return;
    }

    for (const p of this.template.parts) {
      const node = findNodeAtPath(p.path, p.path.length - 1)!;
      this._parts.push(this._createPart(p, node));
    }

    return fragment;
  }

  _createPart(templatePart: TemplatePart, node: Node): Part {
    if (templatePart.type === 'attribute') {
      return new AttributePart(this, node as Element, templatePart.name!, templatePart.strings!);
    } else if (templatePart.type === 'node') {
      return new NodePart(this, node, node.nextSibling!);
    } else {
      throw new Error(`unknown part type: ${templatePart.type}`);
    }
  }

  _createInstance(template: Template) {
    return new TemplateInstance(template);
  }

}
