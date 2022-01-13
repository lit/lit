/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LOCALE_STATUS_EVENT} from './locale-status-event.js';

import type {ReactiveController, ReactiveControllerHost} from 'lit';

class LocalizeController implements ReactiveController {
  host: ReactiveControllerHost;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
  }

  private readonly __litLocalizeEventHandler = (
    event: WindowEventMap[typeof LOCALE_STATUS_EVENT]
  ) => {
    if (event.detail.status === 'ready') {
      this.host.requestUpdate();
    }
  };

  hostConnected() {
    window.addEventListener(
      LOCALE_STATUS_EVENT,
      this.__litLocalizeEventHandler
    );
  }

  hostDisconnected() {
    window.removeEventListener(
      LOCALE_STATUS_EVENT,
      this.__litLocalizeEventHandler
    );
  }
}

/**
 * Re-render the given LitElement whenever a new active locale has loaded.
 *
 * See also {@link localized} for the same functionality as a decorator.
 *
 * When using lit-localize in transform mode, calls to this function are
 * replaced with undefined.
 *
 * Usage:
 *
 *   import {LitElement, html} from 'lit';
 *   import {msg, updateWhenLocaleChanges} from '@lit/localize';
 *
 *   class MyElement extends LitElement {
 *     constructor() {
 *       super();
 *       updateWhenLocaleChanges(this);
 *     }
 *
 *     render() {
 *       return html`<b>${msg('Hello World')}</b>`;
 *     }
 *   }
 */
const _updateWhenLocaleChanges = (host: ReactiveControllerHost) =>
  host.addController(new LocalizeController(host));

export const updateWhenLocaleChanges: typeof _updateWhenLocaleChanges & {
  _LIT_LOCALIZE_CONTROLLER_FN_?: never;
} = _updateWhenLocaleChanges;
