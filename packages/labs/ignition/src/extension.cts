/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as vscode from 'vscode';
import {WebviewSerializer} from './webview-serializer.cjs';

export async function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('ignition.hello', () => {
    vscode.window.showInformationMessage('Hello from Ignition!');
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    'ignition.createWebview',
    async () => {
      const {createWebView} = await import('./lib/lit-module-editor.js');
      const disposable = await createWebView();
      if (disposable) {
        context.subscriptions.push(disposable);
      }
    }
  );
  context.subscriptions.push(disposable);

  disposable = vscode.window.registerWebviewPanelSerializer(
    'ignition',
    new WebviewSerializer()
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
