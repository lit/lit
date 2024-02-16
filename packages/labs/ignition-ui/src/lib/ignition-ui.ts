/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css, PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import * as comlink from 'comlink';
import type {ApiToWebview} from '../in-user-iframe.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {Deferred} from './deferred.js';
import './ignition-stage.js';

/**
 * This represents the API that's accessible from the ignition extension in
 * vscode.
 */
@customElement('ignition-ui')
export class IgnitionUi extends LitElement {
  static styles = css`
    iframe {
      border: none;
      outline: none;
      width: 100%;
      height: 400px;
    }
  `;

  @property()
  storyUrl?: string;

  #frameApi?: comlink.Remote<ApiToWebview>;

  override render() {
    return html`
      <h1>Lit Editor</h1>
      <ignition-stage>
        <iframe
          src=${ifDefined(this.storyUrl)}
          @onload=${this.#onFrameLoad}
          @onerror=${this.#onFrameError}
        ></iframe
      ></ignition-stage>
    `;
  }

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('storyUrl')) {
      this.#frameLoadedDeferred = new Deferred<void>();
    }
    super.update(changedProperties);
  }

  override async updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('storyUrl')) {
      await this.#frameLoaded;
      const iframeWindow = this.#frame!.contentWindow!;

      // get the ApiToWebview object from the iframe
      this.#frameApi = comlink.wrap<ApiToWebview>(
        comlink.windowEndpoint(iframeWindow)
      );
      this.#frameApi.displayText('The webview has connected to the iframe.');
    }
  }

  get #frame() {
    return this.shadowRoot?.querySelector('iframe');
  }

  #frameLoadedDeferred?: Deferred<void>;

  get #frameLoaded() {
    return this.#frameLoadedDeferred!.promise;
  }

  #onFrameLoad() {
    this.#frameLoadedDeferred!.resolve();
  }

  #onFrameError(error: Error) {
    this.#frameLoadedDeferred!.reject(error);
  }
}
