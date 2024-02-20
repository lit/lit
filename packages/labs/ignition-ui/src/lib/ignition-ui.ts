/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import './comlink-stream.js';
import {LitElement, html, css, PropertyValues} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import * as comlink from 'comlink';
import {ifDefined} from 'lit/directives/if-defined.js';
import {Deferred} from './deferred.js';
import './ignition-stage.js';
import type {BoundingBox, ApiToWebview} from './iframe-api-to-webview.js';

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
      pointer-events: all;
    }
    ignition-stage {
      pointer-events: none;
    }
  `;

  @property()
  storyUrl?: string;

  #frameApi?: comlink.Remote<ApiToWebview>;

  @state() private boxesInPageToHighlight: BoundingBox[] = [];
  #frameApiChanged = new Deferred<void>();

  override render() {
    let content;
    if (this.storyUrl == null) {
      content = html`<p>No story URL provided.</p>`;
    } else {
      content = html`
        <ignition-stage .boxesInPageToHighlight=${this.boxesInPageToHighlight}>
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

      const frameApi = comlink.wrap<ApiToWebview>(ourPort);
      this.#frameApi = frameApi;
      this.#frameApiChanged.resolve();
      this.#frameApiChanged = new Deferred();
      await frameApi.displayText('The webview has connected to the iframe.');

      // Listen for bounding boxes from the iframe, pass them on to the stage.
      (async () => {
        const boxes = await frameApi.boundingBoxesOfMouseovered();
        const reader = boxes.getReader();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const result = await Promise.race([
            reader.read(),
            this.#frameApiChanged.promise,
          ]);
          if (this.#frameApi != frameApi) {
            // The frame has changed, so we should stop listening to the old
            // frame.
            console.log(
              'frameAPIChanged resolved, stopping listening to old frame'
            );
            reader.cancel();
            return;
          }
          if (result === undefined) {
            throw new Error(
              `frameAPIChanged resolved but frameAPI didn't change`
            );
          }
          const {value, done} = result;
          if (done) {
            console.log('no more boxes to read');
            return;
          }
          console.log(`got ${value.length} boxes from the iframe`);
          this.boxesInPageToHighlight = value;
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
