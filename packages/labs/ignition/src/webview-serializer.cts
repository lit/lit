/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as vscode from 'vscode';
export class WebviewSerializer
  implements vscode.WebviewPanelSerializer<IgnitionWebviewState>
{
  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    state: IgnitionWebviewState
  ) {
    console.log(`Restoring from state, `, state);
    const {driveWebviewPanel} = await import('./lib/lit-module-editor.js');
    const path = state.modulePath;
    // construct a vscode.Uri from the path
    const documentUri = vscode.Uri.file(path);
    await driveWebviewPanel(webviewPanel, documentUri);
  }
}
