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
import {Directive, directive, nothing, SpreadPart} from '../lit-html.js';

/**
 * A container for a reference to an element.
 */
export class Ref<T = Element> {
  value?: T;

  set(v: T): void {
    this.value = v;
  }
}

class RefDirective extends Directive {

  render(_ref: Ref) {
    return nothing;
  }

  update(part: SpreadPart, [ref]: Parameters<this['render']>) {
    if (ref.value !== part.__element) {
      ref.set(part.__element);
    }
    return nothing;
  }
}

/**
 * Sets the value of a Ref object to the element it's bound to.
 * 
 * A Ref acts as a container for a reference to an element. The ref
 * directive sets the value of the Ref obejct during rendering.
 * 
 * @example
 * 
 *     const inputRef = new Ref();
 *     render(html`<input ${inputRef}>`, container);
 *     input.value.focus();
 */
export const ref = directive(RefDirective);
