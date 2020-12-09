/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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
import {directive, nothing, ElementPart} from '../lit-html.js';
import {DisconnectableDirective} from '../disconnectable-directive.js';

/**
 * Creates a new Ref object, which is container for a reference to an element.
 */
export const createRef = <T = Element>() => new Ref<T>();

class Ref<T = Element> {
  /**
   * The current Element value of the ref, or else `undefined` if the ref is no
   * longer rendered.
   */
  value?: T;

  /**
   * Updates the element value of this Ref. Users should generally not need to
   * call this function; it will be called automatically when passed to the
   * `ref()` directive.
   * @param element
   */
  set(element: T | undefined): void {
    this.value = element;
  }
}

// When callbacks are used for refs, this map tracks the last value the callback
// was called with, for ensuring a directive doesn't clear the ref if the ref
// has already been rendered to a new spot
const lastElementForCallback: WeakMap<
  Function,
  Element | undefined
> = new WeakMap();

export type RefOrCallback = Ref | ((el: Element | undefined) => void);

class RefDirective extends DisconnectableDirective {
  private _element?: Element;
  private _ref?: RefOrCallback;

  render(_ref: RefOrCallback) {
    return nothing;
  }

  update(part: ElementPart, [ref]: Parameters<this['render']>) {
    const refChanged = ref !== this._ref;
    if (refChanged && this._ref !== undefined) {
      // The ref passed to the directive has changed;
      // unset the previous ref's value
      this._updateRefValue(undefined);
    }
    if (refChanged || part.element !== this._element) {
      // We either got a new ref or this is the first render;
      // store the ref/element & update the ref value
      this._ref = ref;
      this._updateRefValue((this._element = part.element));
    }
    return nothing;
  }

  private _updateRefValue(element: Element | undefined) {
    if (typeof this._ref === 'function') {
      // If the current ref was called with a previous value,
      // call with `undefined`
      if (lastElementForCallback.get(this._ref) !== undefined) {
        this._ref(undefined);
      }
      lastElementForCallback.set(this._ref, element);
      // Call the ref with the new element value
      if (element !== undefined) {
        this._ref(element);
      }
    } else {
      this._ref!.set(element);
    }
  }

  disconnectedCallback() {
    // Only clear the box if our element is still the one in it (i.e. another
    // directive instance hasn't rendered its element to it before us); that
    // only happens in the event of the directive being cleared (not via manual
    // disconnection)
    const lastElement =
      typeof this._ref === 'function'
        ? lastElementForCallback.get(this._ref)
        : this._ref?.value;
    if (lastElement === this._element) {
      this._updateRefValue(undefined);
    }
  }

  reconnectedCallback() {
    // If we were manually disconnected, we can safely put our element back in
    // the box, since no rendering could have occurred to change its state
    this._updateRefValue(this._element);
  }
}

/**
 * Sets the value of a Ref object or calls a ref callback with the element it's
 * bound to.
 *
 * A Ref object acts as a container for a reference to an element. A ref
 * callback is a function that takes an element as its only argument.
 *
 * The ref directive sets the value of the Ref object or calls the ref callback
 * during rendering, if the referenced element changed.
 *
 * Note: If a ref callback is rendered to a different element position or is
 * removed in a subsequent render, it will first be called with `undefined`,
 * followed by another call with the new element it was rendered to (if any).
 *
 * @example
 *
 *    // Using Ref object
 *    const inputRef = createRef();
 *    render(html`<input ${ref(inputRef)}>`, container);
 *    inputRef.value.focus();
 *
 *    // Using callback
 *    const callback = (inputElement) => inputElement.focus();
 *    render(html`<input ${ref(callback)}>`, container);
 */
export const ref = directive(RefDirective);
