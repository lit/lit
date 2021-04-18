/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';
import {LOCALE_STATUS_EVENT} from './lit-localize.js';

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
 *   import {Localized} from '@lit/localize/localized-element.js';
 *   import {msg} from '@lit/localize';
 *   import {LitElement, html} from 'lit';
 *
 *   class MyElement extends Localized(LitElement) {
 *     render() {
 *       return html`<b>${msg('greeting', 'Hello World')}</b>`;
 *     }
 *   }
 */
function _Localized<T extends Constructor<LitElement>>(Base: T): T {
  class Localized extends Base {
    private readonly __litLocalizeEventHandler = (
      event: WindowEventMap[typeof LOCALE_STATUS_EVENT]
    ) => {
      if (event.detail.status === 'ready') {
        this.requestUpdate();
      }
    };

    connectedCallback() {
      super.connectedCallback();
      window.addEventListener(
        LOCALE_STATUS_EVENT,
        this.__litLocalizeEventHandler
      );
    }

    disconnectedCallback() {
      window.removeEventListener(
        LOCALE_STATUS_EVENT,
        this.__litLocalizeEventHandler
      );
      super.disconnectedCallback();
    }
  }

  return Localized;
}

export const Localized: typeof _Localized & {
  _LIT_LOCALIZE_LOCALIZED_?: never;
} = _Localized;
