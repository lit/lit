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
