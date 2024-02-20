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
import type {
  ViewportBoundingBox,
  ApiToWebview,
} from './iframe-api-to-webview.js';

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

  @state() private boxesInPageToHighlight: ViewportBoundingBox[] = [];
  #frameApiChanged = new Deferred<void>();

  override render() {
    let content;
    if (this.storyUrl == null) {
      content = html`<p>No story URL provided.</p>`;
    } else {
      content = html`
        <ignition-stage
          .boxesInPageToHighlight=${this.boxesInPageToHighlight}
          @mousemove=${this.#onStageMouseMove}
          @mouseout=${() => (this.boxesInPageToHighlight = [])}
        >
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

  #mouseMoveId = 0;
  async #onStageMouseMove(mouseEvent: MouseEvent) {
    if (this.#frameApi == null) {
      return;
    }
    const id = ++this.#mouseMoveId;
    const stage = mouseEvent.target as HTMLElementTagNameMap['ignition-stage'];
    const windowX = mouseEvent.clientX;
    const windowY = mouseEvent.clientY;
    // Convert the mouse position to the stage's coordinate space.
    const stageRect = stage.getBoundingClientRect();
    const x = windowX - stageRect.left;
    const y = windowY - stageRect.top;
    const boxes = await this.#frameApi.boundingBoxesAtPoint(x, y);
    // Handle race conditions
    if (id !== this.#mouseMoveId) {
      return;
    }
    this.boxesInPageToHighlight = boxes;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-ui': IgnitionUi;
  }
}
