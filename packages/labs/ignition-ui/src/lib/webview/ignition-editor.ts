/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '../protocol/comlink-stream.js';
import {LitElement, html, css, PropertyValues, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import * as comlink from 'comlink';
import {ifDefined} from 'lit/directives/if-defined.js';
import {Deferred} from '../util/deferred.js';
import './ignition-stage.js';
import type {
  ApiToWebview,
  BoundingBoxWithDepth,
} from '../frame/iframe-api-to-webview.js';
import type {
  AutoChangeStoryUrlChangeEvent,
  ModeChangeEvent,
} from './ignition-toolbar.js';
import './ignition-toolbar.js';
import {apiFromExtension} from './api-from-extension.js';

/**
 * The Ignition story editor.
 */
@customElement('ignition-editor')
export class IgnitionEditor extends LitElement {
  static styles = css`
    :host {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    ignition-toolbar {
      /* should not grow or shrink */
      flex: 0 0 auto;
    }
    ignition-stage {
      /* should flex to grow or shrink */
      flex: 1;
    }
    iframe {
      border: none;
      outline: none;
      width: 100%;
    }
  `;

  // Null means it hasn't been set yet. Undefined means we've heard from
  // the extension that there is no story to display.
  @property()
  storyUrl: string | null | undefined = null;

  #frameApi?: comlink.Remote<ApiToWebview>;

  @state()
  private boxesInPageToHighlight: BoundingBoxWithDepth[] = [];

  @state()
  private selectionMode: 'interact' | 'select' = 'select';

  @state()
  private autoChangeStoryUrl = true;

  #frameApiChanged = new Deferred<void>();

  override render() {
    if (this.storyUrl === null) {
      // Display nothing until we hear from the extension.
      return nothing;
    }
    if (this.storyUrl === undefined) {
      return html`<p>No story URL provided.</p>`;
    }
    return html`
      <ignition-toolbar
        .mode=${this.selectionMode}
        .autoChangeStoryUrl=${this.autoChangeStoryUrl}
        @mode-change=${this.#selectionModeChanged}
        @auto-change-story-url-change=${this.#autoChangeStoryUrlChanged}
        @reload-frame=${this.reloadFrame}
      ></ignition-toolbar>
      <ignition-stage
        .boxesInPageToHighlight=${this.boxesInPageToHighlight}
        .blockInput=${this.selectionMode !== 'interact'}
        @mousemove=${this.#onStageMouseMove}
        @mouseout=${() => (this.boxesInPageToHighlight = [])}
        @click=${this.#onStageClick}
      >
        <iframe
          src=${ifDefined(this.storyUrl)}
          @load=${this.#onFrameLoad}
        ></iframe>
      </ignition-stage>
    `;
  }

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('storyUrl')) {
      this.boxesInPageToHighlight = [];
    }
    super.update(changedProperties);
  }

  get #frame() {
    return this.shadowRoot?.querySelector('iframe');
  }

  #onFrameLoad() {
    if (this.#frame?.contentWindow == null) {
      console.error('iframe loaded but it has no contentWindow');
      return;
    }
    const iframeWindow = this.#frame.contentWindow;
    const [ourPort, theirPort] = (() => {
      const channel = new MessageChannel();
      return [channel.port1, channel.port2];
    })();
    iframeWindow.postMessage('ignition-webview-port', '*', [theirPort]);

    this.#frameApi = comlink.wrap<ApiToWebview>(ourPort);
    this.#frameApiChanged.resolve();
    this.#frameApiChanged = new Deferred();

    // Grab the webview styles that VS Code injects and pass the into the
    // Ignition iframe for consistent styling.
    const rootStyle = document.documentElement.getAttribute('style');
    const defaultStyles =
      document.querySelector('#_defaultStyles')?.textContent;
    this.#frameApi.setEnvStyles(rootStyle, defaultStyles);
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

  async #onStageClick(mouseEvent: MouseEvent) {
    while (this.#frameApi == null) {
      await this.#frameApiChanged.promise;
    }
    const stage = mouseEvent.target as HTMLElementTagNameMap['ignition-stage'];
    const stageRect = stage.getBoundingClientRect();
    const x = mouseEvent.clientX - stageRect.left;
    const y = mouseEvent.clientY - stageRect.top;
    const sourceLocation = await this.#frameApi.getSourceLocationFromPoint(
      x,
      y
    );
    if (sourceLocation == null) {
      return;
    }
    const {url, line, column} = sourceLocation;
    const api = await apiFromExtension;
    await api.focusSourceAtLocation(url, line - 1, column - 1);
  }

  #selectionModeChanged(event: ModeChangeEvent) {
    this.selectionMode = event.mode;
  }

  #autoChangeStoryUrlChanged(event: AutoChangeStoryUrlChangeEvent) {
    this.autoChangeStoryUrl = event.locked;
    apiFromExtension.setAutoChangeStoryUrl(this.autoChangeStoryUrl);
  }

  reloadFrame() {
    if (this.#frameApi == null) {
      // not connected yet so nothing to reload
      return;
    }
    this.#frameApi.reload();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-editor': IgnitionEditor;
  }
}
