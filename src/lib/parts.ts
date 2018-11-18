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

import {isDirective} from './directive.js';
import {removeNodes} from './dom.js';
import {noChange, Part} from './part.js';
import {RenderOptions} from './render-options.js';
import {createMarker} from './template.js';
import { primitiveHandler } from './nodepart.js';

export const isPrimitive = (value: any) =>
    (value === null ||
     !(typeof value === 'object' || typeof value === 'function'));

/**
 * Sets attribute values for AttributeParts, so that the value is only set once
 * even if there are multiple parts for an attribute.
 */
export class AttributeCommitter {
  element: Element;
  name: string;
  strings: string[];
  parts: AttributePart[];
  dirty = true;

  constructor(element: Element, name: string, strings: string[]) {
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.parts = [];
    for (let i = 0; i < strings.length - 1; i++) {
      this.parts[i] = this._createPart();
    }
  }

  /**
   * Creates a single part. Override this to create a differnt type of part.
   */
  protected _createPart(): AttributePart {
    return new AttributePart(this);
  }

  protected _getValue(): any {
    const strings = this.strings;
    const l = strings.length - 1;
    let text = '';

    for (let i = 0; i < l; i++) {
      text += strings[i];
      const part = this.parts[i];
      if (part !== undefined) {
        const v = part.value;
        if (v != null &&
            (Array.isArray(v) || typeof v !== 'string' && v[Symbol.iterator])) {
          for (const t of v) {
            text += typeof t === 'string' ? t : String(t);
          }
        } else {
          text += typeof v === 'string' ? v : String(v);
        }
      }
    }

    text += strings[l];
    return text;
  }

  commit(): void {
    if (this.dirty) {
      this.dirty = false;
      this.element.setAttribute(this.name, this._getValue());
    }
  }
}

export class AttributePart implements Part {
  committer: AttributeCommitter;
  value: any = undefined;

  constructor(comitter: AttributeCommitter) {
    this.committer = comitter;
  }

  setValue(value: any): void {
    if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
      this.value = value;
      // If the value is a not a directive, dirty the committer so that it'll
      // call setAttribute. If the value is a directive, it'll dirty the
      // committer if it calls setValue().
      if (!isDirective(value)) {
        this.committer.dirty = true;
      }
    }
  }

  commit() {
    while (isDirective(this.value)) {
      const directive = this.value;
      this.value = noChange;
      directive(this);
    }
    if (this.value === noChange) {
      return;
    }
    this.committer.commit();
  }
}

export class NodePart implements Part {
  options: RenderOptions;
  startNode!: Node;
  endNode!: Node;
  value: any = undefined;
  _pendingValue: any = undefined;

  constructor(options: RenderOptions) {
    this.options = options;
  }

  /**
   * Inserts this part into a container.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  appendInto(container: Node) {
    this.startNode = container.appendChild(createMarker());
    this.endNode = container.appendChild(createMarker());
  }

  /**
   * Inserts this part between `ref` and `ref`'s next sibling. Both `ref` and
   * its next sibling must be static, unchanging nodes such as those that appear
   * in a literal section of a template.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterNode(ref: Node) {
    this.startNode = ref;
    this.endNode = ref.nextSibling!;
  }

  /**
   * Appends this part into a parent part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  appendIntoPart(part: NodePart) {
    part._insert(this.startNode = createMarker());
    part._insert(this.endNode = createMarker());
  }

  /**
   * Appends this part after `ref`
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterPart(ref: NodePart) {
    ref._insert(this.startNode = createMarker());
    this.endNode = ref.endNode;
    ref.endNode = this.startNode;
  }

  setValue(value: any): void {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }
    const value = this._pendingValue;
    if (value === noChange) {
      return;
    }

    const handler = this.options.nodePartValueHandlers.find((handler) => handler.test(value));
    if (handler === undefined) {
      primitiveHandler.insert(this, value);
    } else {
      handler.insert(this, value);
    }
  }

  private _insert(node: Node) {
    this.endNode.parentNode!.insertBefore(node, this.endNode);
  }

  clear(startNode: Node = this.startNode) {
    removeNodes(
        this.startNode.parentNode!, startNode.nextSibling!, this.endNode);
  }
}

/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
export class BooleanAttributePart implements Part {
  element: Element;
  name: string;
  strings: string[];
  value: any = undefined;
  _pendingValue: any = undefined;

  constructor(element: Element, name: string, strings: string[]) {
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error(
          'Boolean attributes can only contain a single expression');
    }
    this.element = element;
    this.name = name;
    this.strings = strings;
  }

  setValue(value: any): void {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }
    if (this._pendingValue === noChange) {
      return;
    }
    const value = !!this._pendingValue;
    if (this.value !== value) {
      if (value) {
        this.element.setAttribute(this.name, '');
      } else {
        this.element.removeAttribute(this.name);
      }
    }
    this.value = value;
    this._pendingValue = noChange;
  }
}

/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
export class PropertyCommitter extends AttributeCommitter {
  single: boolean;

  constructor(element: Element, name: string, strings: string[]) {
    super(element, name, strings);
    this.single =
        (strings.length === 2 && strings[0] === '' && strings[1] === '');
  }

  protected _createPart(): PropertyPart {
    return new PropertyPart(this);
  }

  _getValue() {
    if (this.single) {
      return this.parts[0].value;
    }
    return super._getValue();
  }

  commit(): void {
    if (this.dirty) {
      this.dirty = false;
      (this.element as any)[this.name] = this._getValue();
    }
  }
}

export class PropertyPart extends AttributePart {}

// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the thrid
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;

try {
  const options = {
    get capture() {
      eventOptionsSupported = true;
      return false;
    }
  };
  window.addEventListener('test', options as any, options);
  window.removeEventListener('test', options as any, options);
} catch (_e) {
}

export class EventPart implements Part {
  element: Element;
  eventName: string;
  eventContext?: EventTarget;
  value: any = undefined;
  _options?: AddEventListenerOptions;
  _pendingValue: any = undefined;
  _boundHandleEvent: (event: Event) => void;

  constructor(element: Element, eventName: string, eventContext?: EventTarget) {
    this.element = element;
    this.eventName = eventName;
    this.eventContext = eventContext;
    this._boundHandleEvent = (e) => this.handleEvent(e);
  }

  setValue(value: any): void {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }
    if (this._pendingValue === noChange) {
      return;
    }

    const newListener = this._pendingValue;
    const oldListener = this.value;
    const shouldRemoveListener = newListener == null ||
        oldListener != null &&
            (newListener.capture !== oldListener.capture ||
             newListener.once !== oldListener.once ||
             newListener.passive !== oldListener.passive);
    const shouldAddListener =
        newListener != null && (oldListener == null || shouldRemoveListener);

    if (shouldRemoveListener) {
      this.element.removeEventListener(
          this.eventName, this._boundHandleEvent, this._options);
    }
    this._options = getOptions(newListener);
    if (shouldAddListener) {
      this.element.addEventListener(
          this.eventName, this._boundHandleEvent, this._options);
    }
    this.value = newListener;
    this._pendingValue = noChange;
  }

  handleEvent(event: Event) {
    if (typeof this.value === 'function') {
      this.value.call(this.eventContext || this.element, event);
    } else {
      this.value.handleEvent(event);
    }
  }
}

// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o: any) => o &&
    (eventOptionsSupported ?
         {capture: o.capture, passive: o.passive, once: o.once} :
         o.capture);
