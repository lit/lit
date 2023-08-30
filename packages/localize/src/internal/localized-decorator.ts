/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {updateWhenLocaleChanges} from './localized-controller.js';

import type {ReactiveElement} from '@lit/reactive-element';

export type LocalizedDecorator = {
  // legacy
  (cls: typeof ReactiveElement): void;

  // standard
  (
    target: typeof ReactiveElement,
    context: ClassDecoratorContext<typeof ReactiveElement>
  ): void;
};

/**
 * Class decorator to enable re-rendering the given LitElement whenever a new
 * active locale has loaded.
 *
 * See also {@link updateWhenLocaleChanges} for the same functionality without
 * the use of decorators.
 *
 * When using lit-localize in transform mode, applications of this decorator are
 * removed.
 *
 * Usage:
 *
 *   import {LitElement, html} from 'lit';
 *   import {customElement} from 'lit/decorators.js';
 *   import {msg, localized} from '@lit/localize';
 *
 *   @localized()
 *   @customElement('my-element')
 *   class MyElement extends LitElement {
 *     render() {
 *       return html`<b>${msg('Hello World')}</b>`;
 *     }
 *   }
 */
export const localized: Localized =
  (): LocalizedDecorator =>
  (
    clazz: typeof ReactiveElement,
    _context?: ClassDecoratorContext<typeof ReactiveElement>
  ) => {
    (clazz as typeof ReactiveElement).addInitializer(updateWhenLocaleChanges);
    return clazz;
  };

type Localized = (() => LocalizedDecorator) & {
  // Used by the localize-tools transform to detect this decorator based
  // on type.
  _LIT_LOCALIZE_DECORATOR_?: never;
};
