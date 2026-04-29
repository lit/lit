/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as vscode from 'vscode';

export const logChannel = vscode.window.createOutputChannel('Lit');

/**
 * Holds the shared state of the Lit extension and manages its lifecycle.
 */
export class LitExtension {
  context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async activate() {
    logChannel.appendLine('Activating Lit');

    const {context} = this;

    // Begin: Configure the extension
    // We don't have any custom settings yet, but here's where we would add
    // them. This pattern is copied from Rune's vscode-lit-plugin. Not sure if
    // it's documented anywhere else.
    const extension = vscode.extensions.getExtension(
      'vscode.typescript-language-features'
    );
    if (extension === undefined) {
      logChannel.appendLine(
        'Could not find vscode.typescript-language-features'
      );
      return;
    }

    await extension.activate();
    if (extension.exports.getAPI) {
      logChannel.appendLine('Configuring @lit-labs/tsserver-plugin');
      const api = extension.exports.getAPI(0);
      api.configurePlugin('@lit-labs/tsserver-plugin', {});
    }
    // End: Configure the extension

    // lit.hello command
    const disposable = vscode.commands.registerCommand('lit.hello', () => {
      logChannel.appendLine('lit.hello');
      vscode.window.showInformationMessage('Hello from Lit!');
    });
    context.subscriptions.push(disposable);
  }

  async deactivate() {
    logChannel.appendLine('Deactivating Lit');
  }
}
