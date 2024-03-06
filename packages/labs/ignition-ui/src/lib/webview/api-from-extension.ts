/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {
  MessageFromWebviewToExtension,
  SourceEdit,
} from '../protocol/extension-api-to-webview.js';
import {vscode} from './comlink-endpoint-to-vscode.js';
import {applySourceMap} from '../util/source-map.js';

class ApiFromExtension {
  #sendMessage(message: MessageFromWebviewToExtension) {
    vscode.postMessage(message);
  }

  async focusSourceAtLocation(
    url: string,
    line: number,
    column: number
  ): Promise<void> {
    if (url.endsWith('.js')) {
      const mappedLocation = await applySourceMap(url, line, column);
      if (mappedLocation !== undefined) {
        url = mappedLocation.url;
        line = mappedLocation.line;
        column = mappedLocation.column;
      }
    }
    const filename = new URL(url).pathname.slice(1);
    this.#sendMessage({
      kind: 'focus-source-at-location',
      filename,
      line,
      column,
    });
  }

  setAutoChangeStoryUrl(autoChangeStoryUrl: boolean): void {
    this.#sendMessage({
      kind: 'set-auto-change-story-url',
      autoChangeStoryUrl,
    });
  }

  async applyEdit(edit: SourceEdit) {
    this.#sendMessage({
      kind: 'edit',
      edit,
    });
  }
}

export type {ApiFromExtension};

export const apiFromExtension = new ApiFromExtension();
