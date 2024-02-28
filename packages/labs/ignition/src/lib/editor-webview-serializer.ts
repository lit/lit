/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'node:module';
import {Ignition} from './ignition.js';
import {logChannel} from './logging.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

export class EditorWebviewSerializer
  implements vscode.WebviewPanelSerializer<void>, vscode.Disposable
{
  private readonly ignition: Ignition;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(ignition: Ignition) {
    this.ignition = ignition;
  }

  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    _state: void
  ) {
    logChannel.appendLine(`Restoring editor webview`);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const {EditorPanel} = await import('./editor-panel.js');

    // This will read the state it needs from the Ignition instance
    const panel = await EditorPanel.fromExistingPanel(
      webviewPanel,
      this.ignition
    );
    this.disposables.push(panel);
  }

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
