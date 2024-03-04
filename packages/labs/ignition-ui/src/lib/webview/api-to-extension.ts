/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expose} from './comlink-endpoint-to-vscode.js';
import type {IgnitionEditor} from './ignition-editor.js';

/**
 * This represents the API that's accessible from the ignition extension in
 * vscode.
 */
export class ApiToExtension {
  static expose() {
    expose(new ApiToExtension());
  }

  readonly #ui = document.querySelector('ignition-editor') as IgnitionEditor;

  /**
   * Sets the URL of the story module to edit. Returns once the story UI has
   * been created and is ready to be interacted with.
   */
  setStoryUrl(storyUrl: string | undefined) {
    this.#ui.storyUrl = storyUrl;
  }

  reloadFrame() {
    this.#ui.reloadFrame();
  }
}
export type ApiExposedToExtension = ApiToExtension;
