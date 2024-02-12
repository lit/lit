/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import vscode = require('vscode');
import {logChannel} from './logging.js';

export class WebviewSerializer
  implements vscode.WebviewPanelSerializer<IgnitionWebviewState>
{
  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    state: IgnitionWebviewState
  ) {
    logChannel.appendLine(
      `Restoring webview from state:\n${JSON.stringify(state)}`
    );

    const {driveWebviewPanel} = await import('./ignition-webview.js');
    const path = state.modulePath;
    // construct a vscode.Uri from the path
    const documentUri = vscode.Uri.file(path);
    await driveWebviewPanel(webviewPanel, documentUri);
  }
}
