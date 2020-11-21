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

type RefOrCallback = Ref | ((el: Element | undefined) => void);

class RefDirective extends Directive {
  private _element?: Element;

  render(_ref: RefOrCallback) {
    return nothing;
  }

  update(part: ElementPart, [ref]: Parameters<this['render']>) {
    if (typeof ref === 'function') {
      if (this._element !== part.element) {
        ref((this._element = part.element));
      }
    } else if (ref.value !== part.element) {
      ref.set(part.element);
    }
    return nothing;
  }
}

/**
 * Sets the value of a Ref object or ref callback to the element it's bound
 * to.
 *
 * A Ref object acts as a container for a reference to an element. A ref
 * callbacks is a function that takes an element as its only argument.
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
