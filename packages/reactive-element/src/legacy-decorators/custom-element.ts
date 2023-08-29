/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

import type {Constructor} from './base.js';
import {customElement as standardCustomElement} from '../std-decorators/custom-element.js';

/**
 * Allow for custom element classes with private constructors
 */
type CustomElementClass = Omit<typeof HTMLElement, 'new'>;

const legacyCustomElement = (tagName: string, clazz: CustomElementClass) => {
  customElements.define(tagName, clazz as CustomElementConstructor);
  // Cast as any because TS doesn't recognize the return type as being a
  // subtype of the decorated class when clazz is typed as
  // `Constructor<HTMLElement>` for some reason.
  // `Constructor<HTMLElement>` is helpful to make sure the decorator is
  // applied to elements however.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return clazz as any;
};

export type CustomElementDecorator = {
  // legacy
  (cls: CustomElementClass): void;

  // standard
  (
    target: unknown,
    context: ClassDecoratorContext<Constructor<HTMLElement>>
  ): void;
};

/**
 * Class decorator factory that defines the decorated class as a custom element.
 *
 * ```js
 * @customElement('my-element')
 * class MyElement extends LitElement {
 *   render() {
 *     return html``;
 *   }
 * }
 * ```
 * @category Decorator
 * @param tagName The tag name of the custom element to define.
 */
export const customElement =
  (tagName: string): CustomElementDecorator =>
  (
    classOrTarget: CustomElementClass | unknown,
    context?: ClassDecoratorContext<Constructor<HTMLElement>>
  ) =>
    (typeof classOrTarget === 'function'
      ? legacyCustomElement(tagName, classOrTarget)
      : standardCustomElement(tagName)(
          classOrTarget,
          context!
        )) as CustomElementDecorator;
