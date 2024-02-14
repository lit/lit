/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expose} from './lib/comlink-endpoint-to-vscode.js';
import * as comlink from 'comlink';
import type {ApiToWebview} from './in-user-iframe.js';

// acquireVsCodeApi is automatically injected when running in a VS Code webview
const vscode = acquireVsCodeApi();
{
  const initialStateString =
    document.querySelector('script#state')?.textContent;
  if (initialStateString == null) {
    throw new Error(
      'No initial state found, should have been a script tag with id "state"'
    );
  } else {
    // We only ever set the state because this is info needed to restore the
    // webview when the editor restarts.
    vscode.setState(JSON.parse(initialStateString));
  }
}

interface StoryInfo {
  id: string;
  tagname: string;
  scriptUrl: string;
}

interface LiveStory {
  info: StoryInfo;
  iframe: HTMLIFrameElement;
  api: comlink.Remote<ApiToWebview>;
}

/**
 * This represents the API that's accessible from the ignition extension in
 * vscode.
 */
class ApiToExtension {
  private readonly container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
    container.textContent = `No stories found.`;
  }

  private readonly stories = new Map<string, LiveStory>();

  /**
   * Returns once the story has been created and is ready to be interacted with.
   */
  async createStoryIframe(storyInfo: StoryInfo) {
    if (this.stories.size === 0) {
      this.container.textContent = '';
    }
    if (this.stories.has(storyInfo.id)) {
      throw new Error(`Story with id ${storyInfo.id} already exists`);
    }
    const iframeScriptUrl = new URL('./in-user-iframe.js', import.meta.url)
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
    const heading = document.createElement('h2');
    heading.textContent = storyInfo.tagname;
    this.container.appendChild(heading);
    this.container.appendChild(iframe);
    iframe.style.border = 'none';
    iframe.style.outline = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    const api = await connectedPromise;
    if (this.stories.has(storyInfo.id)) {
      throw new Error(`Story with id ${storyInfo.id} already exists`);
    }
    this.stories.set(storyInfo.id, {info: storyInfo, iframe, api});
  }
}

export type ApiExposedToExtension = ApiToExtension;
const mainElement = document.createElement('main');
document.body.appendChild(mainElement);
expose(vscode, new ApiToExtension(mainElement));
