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

  /**
   * Renders this template to a container. To update a container with new values,
   * reevaluate the template literal and call `renderTo` of the new result.
   */
  renderTo(container: Element|DocumentFragment) {
    let instance = container.__templateInstance as TemplateInstance;
    if (instance === undefined) {
      instance = new TemplateInstance(this.template);
      container.__templateInstance = instance;
      instance.appendTo(container, this.values);
    } else {
      instance.update(this.values);
    }
  }

  renderAt(marker: Node) {
    let instance = marker.__templateInstance as TemplateInstance;
    if (instance === undefined) {
      instance = new TemplateInstance(this.template);
      marker.__templateInstance = instance;
      const fragment = instance.getFragment();
      instance.update(this.values);
      marker.parentNode!.insertBefore(fragment, marker.nextSibling);
    } else {
      instance.update(this.values);
    }    
  }

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
export interface TemplatePart {
  type: string;
  index: number;

  update(instance: TemplateInstance, node: Node, values: Values): void;
}

export class AttributePart implements TemplatePart {
  type: 'attribute';
  index: number;
  name: string;
  rawName: string;
  strings: string[];

  constructor(index: number, name: string, rawName: string, strings: string[]) {
    this.index = index;
    this.name = name;
    this.rawName = rawName;
    this.strings = strings;
  }

  update(_instance: TemplateInstance, node: Node, values: Values) {
    console.assert(node.nodeType === Node.ELEMENT_NODE);
    const strings = this.strings;
    let text = '';
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < strings.length - 1) {
        const v = values.nextValue(node);
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
    (node as Element).setAttribute(this.name, text);
  }
}

export class NodePart implements TemplatePart {
  type: 'node';
  index: number;

  constructor(index: number) {
    this.index = index;
  }

  update(instance: TemplateInstance, node: Node, values: Values): void {
    console.assert(node.nodeType === Node.TEXT_NODE);

    const value = values.nextValue(node);

    if (value && typeof value !== 'string' && value[Symbol.iterator]) {
      const fragment = document.createDocumentFragment();
      for (const item of value) {
        const marker = new Text();
        fragment.appendChild(marker);
        instance.renderValue(item, marker);
      }
      instance.renderValue(fragment, node);          
    } else {
      instance.renderValue(value, node);
    }
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
    this.element.innerHTML = this._getTemplateHtml(this._strings);
    const walker = document.createTreeWalker(this.element.content,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let index = -1;
    let partIndex = 0;
    const nodesToRemove = [];
    const attributesToRemove = [];
    while (walker.nextNode()) {
      index++;
      const node = walker.currentNode;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const attributes = node.attributes;
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes.item(i);
          const value = attribute.value;
          const strings = value.split(exprMarker);
          if (strings.length > 1) {
            const attributeString = this._strings[partIndex];
            partIndex += strings.length - 1;
            const match = attributeString.match(/((?:\w|[.\-_])+)=?("|')?$/);
            const rawName = match![1];
            this.parts.push(new AttributePart(index, attribute.name, rawName, strings));
            attributesToRemove.push(attribute);
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const strings = node.nodeValue!.split(exprMarker);
        if (strings.length > 1) {
          // Generate a new text node for each literal and part
          partIndex += strings.length - 1;
          for (let i = 0; i < strings.length; i++) {
            const string = strings[i];
            const literalNode = new Text(string);
            node.parentNode!.insertBefore(literalNode, node);
            index++;
            if (i < strings.length - 1) {
              const partNode = new Text();
              node.parentNode!.insertBefore(partNode, node);
              this.parts.push(new NodePart(index));
            }
          }
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

  private _getTemplateHtml(strings: TemplateStringsArray): string {
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

export class Values {
  private _values: Iterator<any>;

  constructor(values: Iterable<any>) {
    this._values = values[Symbol.iterator]();
  }

  nextValue(node: Node) {
    const next = this._values.next();
    if (next.done) {
      throw new Error('No more values');
    }
    let value = next.value;
    while (typeof value === 'function') {
      try {
        value = value(node);
      } catch (e) {
        console.error(e);
        return;
      }
    }
    return value;
  }
}

export class TemplateInstance {
  _template: Template;
  _parts: {part: TemplatePart, node: Node}[] = [];
  startNode: Node;
  endNode: Node;

  constructor(template: Template) {
    this._template = template;
  }

  appendTo(container: Element|DocumentFragment, values: any[]) {
    const fragment = this._clone();
    this.update(values);
    container.appendChild(fragment);
  }

  update(values: any[]) {
    const valuesList = new Values(values);
    for (const {part, node} of this._parts) {
      part.update(this, node, valuesList);
    }
  }

  getFragment() {
    const fragment = this._clone();
    this.startNode = fragment.insertBefore(new Text(), fragment.firstChild);
    this.endNode = fragment.appendChild(new Text());
    return fragment;
  }

  private _clone(): DocumentFragment {
    const fragment = document.importNode(this._template.element.content, true);

    if (this._template.parts.length > 0) {
      const walker = document.createTreeWalker(fragment,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);

      const parts = this._template.parts;
      let index = -1;
      let partIndex = 0;
      let part = parts[0];
      
      while (walker.nextNode() && partIndex < parts.length) {
        index++;
        if (index === part.index) {
          const node = walker.currentNode;
          this._parts.push({part, node});
          part = parts[++partIndex];
        }
      }
    }
    return fragment;
  }

  /**
   * Converts a raw values array passed to a template tag into an iterator so
   * that TemplateParts can consume it while updating.
   * 
   * Contains a trampoline to evaluate thunks until they return a non-function value.
   */
  // private * _getValues(values: any[]) {
  //   for (let value of values) {
  //     // console.log('value', value, typeof value === 'function');
  //   }
  // }

  getValue(value: any, node: Node) {
    while (typeof value === 'function') {
      try {
        value = value(node);
      } catch (e) {
        console.error(e);
        return;
      }
    }
    return value;
  }

  renderValue(value: any, node: Node) {
    // console.log('renderValue', value, node);
    let templateInstance = node.__templateInstance as TemplateInstance;
    if (templateInstance !== undefined && (!(value instanceof TemplateResult) || templateInstance._template !== value.template)) {
      this._cleanup(node);
    }

    if (value instanceof Node) {
      const fragment = value instanceof DocumentFragment;
      // TODO: also deal with empty fragments
      const startNode = fragment ? value.firstChild! : value;
      const endNode = fragment ? value.lastChild! : value;
      node.__templateInstance = {startNode,endNode};
      node.parentNode!.insertBefore(value, node.nextSibling);
    } else if (value instanceof TemplateResult) {
      if (templateInstance === undefined || value.template !== templateInstance._template) {
        // We haven't stamped this template to this location, so create
        // a new instance and insert it.
        // TODO: Add keys and check for key equality also
        node.textContent = '';
        templateInstance = node.__templateInstance = new TemplateInstance(value.template);
        const fragment = templateInstance.getFragment();
        node.parentNode!.insertBefore(fragment, node.nextSibling);
      }
      templateInstance.update(value.values);
    } else {
      node.textContent = value;
    }
  }

  private _cleanup(node: Node) {
    const instance = node.__templateInstance!;
    // We had a previous template instance here, but don't now: clean up
    let nextNode: Node|null = instance.startNode;
    while (nextNode !== null) {
      const n = nextNode;
      nextNode = nextNode.nextSibling;
      n.parentNode!.removeChild(n);
      if (n === instance.endNode) {
        break;
      }
    }
    node.__templateInstance = undefined;
  }

}

declare global {
  interface Node {
    __templateInstance?: {
      startNode: Node;
      endNode: Node;
    };
    __startMarker?: Node;
  }
}
