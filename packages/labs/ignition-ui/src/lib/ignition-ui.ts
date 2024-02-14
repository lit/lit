/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import * as comlink from 'comlink';
import type {ApiToWebview} from '../in-user-iframe.js';

export interface StoryInfo {
  tagname: string;
  scriptUrl: string;
}

interface LiveStory {
  info: StoryInfo;
  iframe: HTMLIFrameElement;
  api: Promise<comlink.Remote<ApiToWebview>>;
}

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

  readonly #stories = new Map<string, LiveStory>();

  override render() {
    return html`
      <h1>Lit Editor</h1>
      ${this.#renderStories()}
    `;
  }

  #renderStories() {
    if (this.#stories.size === 0) {
      return html`<p>No stories to display</p>`;
    }
    return html`
      ${[...this.#stories.values()].map((liveStory) => {
        return html`
          <h2>${liveStory.info.tagname}</h2>
          ${liveStory.iframe}
        `;
      })}
    `;
  }

  /**
   * Returns once the story has been created and is ready to be interacted with.
   */
  async createStoryIframe(storyInfo: StoryInfo) {
    // TODO (justinfagnani): Migrate from tag name to story file export name
    const storyId = storyInfo.scriptUrl + '?' + storyInfo.tagname;
    if (this.#stories.has(storyId)) {
      throw new Error(`Story with ${storyId} already exists`);
    }
    const iframeScriptUrl = new URL('../in-user-iframe.js', import.meta.url)
      .href;
    const iframe = document.createElement('iframe');
    iframe.srcdoc = /* html */ `
        <!doctype html>
        <script type='module' src='${iframeScriptUrl}'></script>
        <script type='module' src='${storyInfo.scriptUrl}'></script>
        <${storyInfo.tagname}></${storyInfo.tagname}>
      `;
    const connectedPromise = new Promise<comlink.Remote<ApiToWebview>>(
      (resolve) => {
        iframe.onload = async () => {
          const iframeWindow = iframe.contentWindow!;

          // get the ApiToWebview object from the iframe
          const apiToWebview = comlink.wrap<ApiToWebview>(
            comlink.windowEndpoint(iframeWindow)
          );
          apiToWebview.displayText('The webview has connected to the iframe.');
          resolve(apiToWebview);
        };
      }
    );
    const api = connectedPromise;
    if (this.#stories.has(storyId)) {
      throw new Error(`Story with ${storyId} already exists`);
    }
    this.#stories.set(storyId, {info: storyInfo, iframe, api});
    this.requestUpdate();
  }
}
