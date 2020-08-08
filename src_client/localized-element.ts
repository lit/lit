/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {LitElement} from 'lit-element';
import {localeReady, LOCALE_CHANGED_EVENT} from './index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

/**
 * Class mixin for LitElement-based custom elements that ensures rendering is
 * aligned with the currently active locale.
 *
 * Defers rendering until messages for the active locale have loaded, and
 * triggers re-rendering every time the active locale changes.
 *
 * When using lit-localize in transform mode, applications of this mixin are
 * automatically removed.
 *
 * Usage:
 *
 *   import {Localized} from 'lit-localize/localized-element.js';
 *   import {msg} from 'lit-localize';
 *   import {LitElement, html} from 'lit-html';
 *
 *   class MyElement extends Localized(LitElement) {
 *     render() {
 *       return html`<b>${msg('greeting', 'Hello World')}</b>`;
 *     }
 *   }
 */
function _Localized<T extends Constructor<LitElement>>(Base: T): T {
  class Localized extends Base {
    private __boundRequestUpdate = () => this.requestUpdate();

    connectedCallback() {
      super.connectedCallback();
      window.addEventListener(LOCALE_CHANGED_EVENT, this.__boundRequestUpdate);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener(
        LOCALE_CHANGED_EVENT,
        this.__boundRequestUpdate
      );
    }

    protected async performUpdate(): Promise<unknown> {
      await localeReady();
      return super.performUpdate();
    }
  }

  return Localized;
}

export const Localized: typeof _Localized & {
  _LIT_LOCALIZE_LOCALIZED_?: never;
} = _Localized;
