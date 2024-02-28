/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {MessageFromWebviewToExtension} from '../protocol/extension-api-to-webview.js';
import {vscode} from './comlink-endpoint-to-vscode.js';

class ApiFromExtension {
  #sendMessage(message: MessageFromWebviewToExtension) {
    vscode.postMessage(message);
  }

  focusSourceAtLocation(filename: string, line: number, column: number): void {
    this.#sendMessage({
      kind: 'focus-source-at-location',
      filename,
      line,
      column,
    });
  }
}

export const apiFromExtension = new ApiFromExtension();
