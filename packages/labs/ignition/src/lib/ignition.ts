/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'module';
import {logChannel} from './logging.js';
import {WebviewSerializer} from './webview-serializer.js';
import {ElementsDataProvider} from './elements-data-provider.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

/**
 * Holds the shared state of the Ignition extension and manages its lifecycle.
 */
export class Ignition {
  context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async activate() {
    logChannel.appendLine('Activating Ignition');

    const {context} = this;

    let disposable = vscode.commands.registerCommand(
      'ignition.createWebview',
      async () => {
        const {createWebView} = await import('./ignition-webview.js');
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

    const elementsDataProvider = new ElementsDataProvider();
    disposable = vscode.window.registerTreeDataProvider(
      'ignition-element-view',
      elementsDataProvider
    );
    context.subscriptions.push(disposable);
  }

  async deactivate() {
    // Clean up any resources
    logChannel.appendLine('Deactivating Ignition');
  }
}
