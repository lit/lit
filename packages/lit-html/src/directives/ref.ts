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
import {Directive, directive, nothing, ElementPart} from '../lit-html.js';

/**
 * Creates a new Ref object, which is container for a reference to an element.
 */
export const createRef = <T = Element>() => new Ref<T>();

class Ref<T = Element> {
  value?: T;

  set(v: T | undefined): void {
    this.value = v;
  }
}

export type RefOrCallback = Ref | ((el: Element | undefined) => void);

class RefDirective extends Directive {
  private _element?: Element;
  private _ref?: RefOrCallback;

  render(_ref: RefOrCallback) {
    return nothing;
  }

  update(part: ElementPart, [ref]: Parameters<this['render']>) {
    if (ref !== this._ref || part.element !== this._element) {
      this._ref = ref;
      this._element = part.element;
      if (typeof ref === 'function') {
        ref(this._element);
      } else {
        ref.set(this._element);
      }
    }
    return nothing;
  }
}

/**
 * Sets the value of a Ref object or ref callback to the element it's bound
 * to.
 *
 * A Ref object acts as a container for a reference to an element. A ref
 * callback is a function that takes an element as its only argument.
 *
 * The ref directive sets the value of the Ref object or calls the ref
 * callback during rendering, if the referenced element changed.
 *
 * Note: ref() does not currently clear a Ref object or call a callback
 * when an element is disposed of during conditional rendering. This will
 * be enabled when disconnectable directives are added.
 *
 * @example
 *
 *     const inputRef = createRef();
 *     render(html`<input ${ref(inputRef)}>`, container);
 *     inputRef.value.focus();
 */
export const ref = directive(RefDirective);
