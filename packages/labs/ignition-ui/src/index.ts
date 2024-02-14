/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expose} from './lib/comlink-endpoint-to-vscode.js';
import {IgnitionUi, type StoryInfo} from './lib/ignition-ui.js';

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

/**
 * This represents the API that's accessible from the ignition extension in
 * vscode.
 */
class ApiToExtension {
  readonly #ui = document.querySelector('ignition-ui') as IgnitionUi;

  /**
   * Returns once the story has been created and is ready to be interacted with.
   */
  async createStoryIframe(storyInfo: StoryInfo) {
    await this.#ui.createStoryIframe(storyInfo);
  }
}

export type ApiExposedToExtension = ApiToExtension;
const mainElement = document.createElement('main');
document.body.appendChild(mainElement);
expose(vscode, new ApiToExtension());
