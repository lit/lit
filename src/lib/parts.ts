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
 * @module lit-html
 */

import {isDirective} from './directive.js';
import {removeNodes} from './dom.js';
import {noChange, nothing, Part} from './part.js';
import {RenderOptions} from './render-options.js';
import {TemplateInstance} from './template-instance.js';
import {TemplateResult} from './template-result.js';
import {createMarker} from './template.js';

// https://tc39.github.io/ecma262/#sec-typeof-operator
export type Primitive = null|undefined|boolean|number|string|symbol|bigint;
export const isPrimitive = (value: unknown): value is Primitive => {
  return (
      value === null ||
      !(typeof value === 'object' || typeof value === 'function'));
};
export const isIterable = (value: unknown): value is Iterable<unknown> => {
  return Array.isArray(value) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(value && (value as any)[Symbol.iterator]);
};

/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attribute. The value is only set once even if there are multiple parts
 * for an attribute.
 */
export class AttributeCommitter {
  readonly element: Element;
  readonly name: string;
  readonly strings: ReadonlyArray<string>;
  readonly parts: ReadonlyArray<AttributePart>;
  dirty = true;

  constructor(element: Element, name: string, strings: ReadonlyArray<string>) {
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.parts = [];
    for (let i = 0; i < strings.length - 1; i++) {
      (this.parts as AttributePart[])[i] = this._createPart();
    }
  }

  /**
   * Creates a single part. Override this to create a differnt type of part.
   */
  protected _createPart(): AttributePart {
    return new AttributePart(this);
  }

  protected _getValue(): unknown {
    const strings = this.strings;
    const l = strings.length - 1;
    let text = '';

    for (let i = 0; i < l; i++) {
      text += strings[i];
      const part = this.parts[i];
      if (part !== undefined) {
        const v = part.value;
        if (isPrimitive(v) || !isIterable(v)) {
          text += typeof v === 'string' ? v : String(v);
        } else {
          for (const t of v) {
            text += typeof t === 'string' ? t : String(t);
          }
        }
      }
    }

    text += strings[l];
    return text;
  }

  commit(): void {
    if (this.dirty) {
      this.dirty = false;
      this.element.setAttribute(this.name, this._getValue() as string);
    }
  }
}

/**
 * A Part that controls all or part of an attribute value.
 */
export class AttributePart implements Part {
  readonly committer: AttributeCommitter;
  value: unknown = undefined;

  constructor(committer: AttributeCommitter) {
    this.committer = committer;
  }

  setValue(value: unknown): void {
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

/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */
export class NodePart implements Part {
  readonly options: RenderOptions;
  startNode!: Node;
  endNode!: Node;
  value: unknown = undefined;
  private __pendingValue: unknown = undefined;

  constructor(options: RenderOptions) {
    this.options = options;
  }

  /**
   * Appends this part into a container.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  appendInto(container: Node) {
    this.startNode = container.appendChild(createMarker());
    this.endNode = container.appendChild(createMarker());
  }

  /**
   * Inserts this part after the `ref` node (between `ref` and `ref`'s next
   * sibling). Both `ref` and its next sibling must be static, unchanging nodes
   * such as those that appear in a literal section of a template.
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
    part.__insert(this.startNode = createMarker());
    part.__insert(this.endNode = createMarker());
  }

  /**
   * Inserts this part after the `ref` part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterPart(ref: NodePart) {
    ref.__insert(this.startNode = createMarker());
    this.endNode = ref.endNode;
    ref.endNode = this.startNode;
  }

  setValue(value: unknown): void {
    this.__pendingValue = value;
  }

  commit() {
    if (this.startNode.parentNode === null) {
      return;
    }
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue;
      this.__pendingValue = noChange;
      directive(this);
    }
    const value = this.__pendingValue;
    if (value === noChange) {
      return;
    }
    if (isPrimitive(value)) {
      if (value !== this.value) {
        this.__commitText(value);
      }
    } else if (value instanceof TemplateResult) {
      this.__commitTemplateResult(value);
    } else if (value instanceof Node) {
      this.__commitNode(value);
    } else if (isIterable(value)) {
      this.__commitIterable(value);
    } else if (value === nothing) {
      this.value = nothing;
      this.clear();
    } else {
      // Fallback, will render the string representation
      this.__commitText(value);
    }
  }

  private __insert(node: Node) {
    this.endNode.parentNode!.insertBefore(node, this.endNode);
  }

  private __commitNode(value: Node): void {
    if (this.value === value) {
      return;
    }
    this.clear();
    this.__insert(value);
    this.value = value;
  }

  private __commitText(value: unknown): void {
    const node = this.startNode.nextSibling!;
    value = value == null ? '' : value;
    // If `value` isn't already a string, we explicitly convert it here in case
    // it can't be implicitly converted - i.e. it's a symbol.
    const valueAsString: string =
        typeof value === 'string' ? value : String(value);
    if (node === this.endNode.previousSibling &&
        node.nodeType === 3 /* Node.TEXT_NODE */) {
      // If we only have a single text node between the markers, we can just
      // set its value, rather than replacing it.
      // TODO(justinfagnani): Can we just check if this.value is primitive?
      (node as Text).data = valueAsString;
    } else {
      this.__commitNode(document.createTextNode(valueAsString));
    }
    this.value = value;
  }

  private __commitTemplateResult(value: TemplateResult): void {
    const template = this.options.templateFactory(value);
    if (this.value instanceof TemplateInstance &&
        this.value.template === template) {
      this.value.update(value.values);
    } else {
      // Make sure we propagate the template processor from the TemplateResult
      // so that we use its syntax extension, etc. The template factory comes
      // from the render function options so that it can control template
      // caching and preprocessing.
      const instance =
          new TemplateInstance(template, value.processor, this.options);
      const fragment = instance._clone();
      instance.update(value.values);
      this.__commitNode(fragment);
      this.value = instance;
    }
  }

  private __commitIterable(value: Iterable<unknown>): void {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.

    // If _value is an array, then the previous render was of an
    // iterable and _value will contain the NodeParts from the previous
    // render. If _value is not an array, clear this part and make a new
    // array for NodeParts.
    if (!Array.isArray(this.value)) {
      this.value = [];
      this.clear();
    }

    // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render
    const itemParts = this.value as NodePart[];
    let partIndex = 0;
    let itemPart: NodePart|undefined;

    for (const item of value) {
      // Try to reuse an existing part
      itemPart = itemParts[partIndex];

      // If no existing part, create a new one
      if (itemPart === undefined) {
        itemPart = new NodePart(this.options);
        itemParts.push(itemPart);
        if (partIndex === 0) {
          itemPart.appendIntoPart(this);
        } else {
          itemPart.insertAfterPart(itemParts[partIndex - 1]);
        }
      }
      itemPart.setValue(item);
      itemPart.commit();
      partIndex++;
    }

    if (partIndex < itemParts.length) {
      // Truncate the parts array so _value reflects the current state
      itemParts.length = partIndex;
      this.clear(itemPart && itemPart.endNode);
    }
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
  readonly element: Element;
  readonly name: string;
  readonly strings: readonly string[];
  value: unknown = undefined;
  private __pendingValue: unknown = undefined;

  constructor(element: Element, name: string, strings: readonly string[]) {
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error(
          'Boolean attributes can only contain a single expression');
    }
    this.element = element;
    this.name = name;
    this.strings = strings;
  }

  setValue(value: unknown): void {
    this.__pendingValue = value;
  }

  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue;
      this.__pendingValue = noChange;
      directive(this);
    }
    if (this.__pendingValue === noChange) {
      return;
    }
    const value = !!this.__pendingValue;
    if (this.value !== value) {
      if (value) {
        this.element.setAttribute(this.name, '');
      } else {
        this.element.removeAttribute(this.name);
      }
      this.value = value;
    }
    this.__pendingValue = noChange;
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
  readonly single: boolean;

  constructor(element: Element, name: string, strings: ReadonlyArray<string>) {
    super(element, name, strings);
    this.single =
        (strings.length === 2 && strings[0] === '' && strings[1] === '');
  }

  protected _createPart(): PropertyPart {
    return new PropertyPart(this);
  }

  protected _getValue() {
    if (this.single) {
      return this.parts[0].value;
    }
    return super._getValue();
  }

  commit(): void {
    if (this.dirty) {
      this.dirty = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.element as any)[this.name] = this._getValue();
    }
  }
}

export class PropertyPart extends AttributePart {}

// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the third
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;

// Wrap into an IIFE because MS Edge <= v41 does not support having try/catch
// blocks right into the body of a module
(() => {
  try {
    const options = {
      get capture() {
        eventOptionsSupported = true;
        return false;
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener('test', options as any, options);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.removeEventListener('test', options as any, options);
  } catch (_e) {
    // event options not supported
  }
})();

type EventHandlerWithOptions =
    EventListenerOrEventListenerObject&Partial<AddEventListenerOptions>;
export class EventPart implements Part {
  readonly element: Element;
  readonly eventName: string;
  readonly eventContext?: EventTarget;
  value: undefined|EventHandlerWithOptions = undefined;
  private __options?: AddEventListenerOptions;
  private __pendingValue: undefined|EventHandlerWithOptions = undefined;
  private readonly __boundHandleEvent: (event: Event) => void;

  constructor(element: Element, eventName: string, eventContext?: EventTarget) {
    this.element = element;
    this.eventName = eventName;
    this.eventContext = eventContext;
    this.__boundHandleEvent = (e) => this.handleEvent(e);
  }

  setValue(value: undefined|EventHandlerWithOptions): void {
    this.__pendingValue = value;
  }

  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive = this.__pendingValue;
      this.__pendingValue = noChange as EventHandlerWithOptions;
      directive(this);
    }
    if (this.__pendingValue === noChange) {
      return;
    }

    const newListener = this.__pendingValue;
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
          this.eventName, this.__boundHandleEvent, this.__options);
    }
    if (shouldAddListener) {
      this.__options = getOptions(newListener);
      this.element.addEventListener(
          this.eventName, this.__boundHandleEvent, this.__options);
    }
    this.value = newListener;
    this.__pendingValue = noChange as EventHandlerWithOptions;
  }

  handleEvent(event: Event) {
    if (typeof this.value === 'function') {
      this.value.call(this.eventContext || this.element, event);
    } else {
      (this.value as EventListenerObject).handleEvent(event);
    }
  }
}

// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o: AddEventListenerOptions|undefined) => o &&
    (eventOptionsSupported ?
         {capture: o.capture, passive: o.passive, once: o.once} :
         o.capture as AddEventListenerOptions);
