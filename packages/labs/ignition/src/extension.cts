/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('ignition.hello', () => {
    vscode.window.showInformationMessage('Hello from Ignition!');
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    'ignition.createWebview',
    async () => {
      const {createWebView} = await import('./lib/ignition-webview.js');
      const disposable = await createWebView();
      if (disposable) {
        context.subscriptions.push(disposable);
      }
    }
  );
  context.subscriptions.push(disposable);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const {WebviewSerializer} = await import('./lib/webview-serializer.js');
  disposable = vscode.window.registerWebviewPanelSerializer(
    'ignition',
    new WebviewSerializer()
  );
  context.subscriptions.push(disposable);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const {ElementsDataProvider} = await import(
    './lib/elements-data-provider.js'
  );
  const elementsDataProvider = new ElementsDataProvider();
  disposable = vscode.window.registerTreeDataProvider(
    'ignition-element-view',
    elementsDataProvider
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
