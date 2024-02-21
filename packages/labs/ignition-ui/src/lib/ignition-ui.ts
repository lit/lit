/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import './comlink-stream.js';
import {LitElement, html, css, PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import * as comlink from 'comlink';
import type {ApiToWebview} from '../in-user-iframe.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {Deferred} from './deferred.js';
import './ignition-stage.js';
import {streamAsyncIterator} from './comlink-stream.js';

/**
 * Renders the UI that runs in the webview and communicates with the stories
 * iframe.
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
    let content;
    if (this.storyUrl == null) {
      content = html`<p>No story URL provided.</p>`;
    } else {
      content = html`
        <ignition-stage>
          <iframe
            src=${ifDefined(this.storyUrl)}
            @load=${this.#onFrameLoad}
            @error=${this.#onFrameError}
          ></iframe>
        </ignition-stage>
      `;
    }
    return html`
      <h1>Lit Editor</h1>
      ${content}
    `;
  }

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('storyUrl')) {
      this.#frameLoadedDeferred = new Deferred();
    }
    super.update(changedProperties);
  }

  override async updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('storyUrl')) {
      const iframeWindow = await this.#frameLoaded;
      const [ourPort, theirPort] = (() => {
        const channel = new MessageChannel();
        return [channel.port1, channel.port2];
      })();
      iframeWindow.postMessage('ignition-webview-port', '*', [theirPort]);

      this.#frameApi = comlink.wrap<ApiToWebview>(ourPort);
      await this.#frameApi.displayText(
        'The webview has connected to the iframe.'
      );

      const api = this.#frameApi;
      (async () => {
        console.log('Streaming a count to five, then disposing.');
        try {
          const counter = await api.countingStream();
          for await (const num of streamAsyncIterator(counter)) {
            console.log(`from iframe: `, num);
            if (num >= 5) {
              // Breaking early from the loop is enough to cancel the stream.
              console.log('Breaking from counting loop');
              break;
            }
          }
          console.log('loop exited');
        } catch (e) {
          console.error('Error working with counter:', e);
        }
      })();
    }
  }

  get #frame() {
    return this.shadowRoot?.querySelector('iframe');
  }

  #frameLoadedDeferred = new Deferred<Window>();

  get #frameLoaded() {
    return this.#frameLoadedDeferred.promise;
  }

  #onFrameLoad() {
    if (this.#frame?.contentWindow == null) {
      throw new Error('iframe loaded but it has no contentWindow');
    }
    this.#frameLoadedDeferred.resolve(this.#frame.contentWindow);
  }

  #onFrameError(error: Error) {
    this.#frameLoadedDeferred.reject(error);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-ui': IgnitionUi;
  }
}
