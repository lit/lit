/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {updateWhenLocaleChanges} from './localized-controller.js';

import type {ReactiveElement} from '@lit/reactive-element';
import type {
  Constructor,
  ClassDescriptor,
} from '@lit/reactive-element/decorators/base.js';

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
const _localized = () => (
  classOrDescriptor: Constructor<ReactiveElement> | ClassDescriptor
) =>
  typeof classOrDescriptor === 'function'
    ? legacyLocalized((classOrDescriptor as unknown) as typeof ReactiveElement)
    : standardLocalized(classOrDescriptor);

export const localized: typeof _localized & {
  _LIT_LOCALIZE_DECORATOR_?: never;
} = _localized;

const standardLocalized = ({kind, elements}: ClassDescriptor) => {
  return {
    kind,
    elements,
    finisher(clazz: typeof ReactiveElement) {
      clazz.addInitializer(updateWhenLocaleChanges);
    },
  };
};

const legacyLocalized = (clazz: typeof ReactiveElement) => {
  clazz.addInitializer(updateWhenLocaleChanges);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return clazz as any;
};
