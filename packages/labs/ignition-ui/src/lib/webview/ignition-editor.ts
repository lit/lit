/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {provide} from '@lit/context';
import * as comlink from 'comlink';
import {LitElement, PropertyValues, css, html, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import type {
  ApiToWebview,
  BoundingBoxWithDepth,
} from '../frame/iframe-api-to-webview.js';
import '../protocol/comlink-stream.js';
import {Deferred} from '../util/deferred.js';
import {apiFromExtension} from './api-from-extension.js';
import './ignition-stage.js';
import './ignition-toolbar.js';
import type {
  AutoChangeStoryUrlChangeEvent,
  SelectionModeChangeEvent,
} from './ignition-toolbar.js';
import {frameApiContext} from './modes/editor-mode.js';
import {SelectMode} from './modes/select-mode.js';

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

  @provide({context: frameApiContext})
  private _frameApi?: comlink.Remote<ApiToWebview>;

  @state()
  private boxesInPageToHighlight: BoundingBoxWithDepth[] = [];

  @state()
  private selectionMode: 'interact' | 'select' = 'select';

  @state()
  private autoChangeStoryUrl = true;

  #frameApiChanged = new Deferred<void>();

  #currentMode?: HTMLElement = new SelectMode();

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
        @selection-mode-change=${this.#selectionModeChanged}
        @auto-change-story-url-change=${this.#autoChangeStoryUrlChanged}
      ></ignition-toolbar>
      <ignition-stage
        .boxesInPageToHighlight=${this.boxesInPageToHighlight}
        .blockInput=${this.selectionMode !== 'interact'}
      >
        <div slot="mode">${this.#currentMode}</div>
        <iframe
          slot="frame"
          src=${ifDefined(this.storyUrl)}
          @load=${this.#onFrameLoad}
          @error=${this.#onFrameError}
        ></iframe>
      </ignition-stage>
    `;
  }

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('storyUrl')) {
      this.#frameLoadedDeferred = new Deferred();
      this.boxesInPageToHighlight = [];
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

      this._frameApi = comlink.wrap<ApiToWebview>(ourPort);
      this.#frameApiChanged.resolve();
      this.#frameApiChanged = new Deferred();

      // Grab the webview styles that VS Code injects and pass the into the
      // Ignition iframe for consistent styling.
      const rootStyle = document.documentElement.getAttribute('style');
      const defaultStyles =
        document.querySelector('#_defaultStyles')?.textContent;
      this._frameApi.setEnvStyles(rootStyle, defaultStyles);
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

  #selectionModeChanged(event: SelectionModeChangeEvent) {
    const selectionMode = (this.selectionMode = event.mode);
    if (selectionMode === 'select') {
      this.#currentMode = new SelectMode();
    } else {
      this.#currentMode = undefined;
    }
  }

  #autoChangeStoryUrlChanged(event: AutoChangeStoryUrlChangeEvent) {
    this.autoChangeStoryUrl = event.locked;
    apiFromExtension.setAutoChangeStoryUrl(this.autoChangeStoryUrl);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-editor': IgnitionEditor;
  }
}
