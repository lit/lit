/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AbsolutePath, LitElementDeclaration} from '@lit-labs/analyzer';
import {createRequire} from 'module';
import {getAnalyzer} from './analyzer.js';
import {ElementsDataProvider} from './elements-data-provider.js';
import {logChannel} from './logging.js';
import {getStoriesModule} from './stories.js';
import {WebviewSerializer} from './webview-serializer.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

/**
 * Holds the shared state of the Ignition extension and manages its lifecycle.
 */
export class Ignition {
  context: vscode.ExtensionContext;

  #currentElement?: LitElementDeclaration;

  get currentElement() {
    return this.#currentElement!;
  }

  set currentElement(value: LitElementDeclaration | undefined) {
    this.#currentElement = value;
  }

  #currentStoryPath?: string;

  get currentStoryPath() {
    return this.#currentStoryPath!;
  }

  set currentStoryPath(value: string | undefined) {
    this.#currentStoryPath = value;
  }

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

    // Listen for active text editor changes and set up workspace resources
    disposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      // TODO (justinfagnani): only do this work - especially creating the
      // analyzer - if there is some Ignition UI open. One way to organize this
      // may be to only create an Ignition instance when the first Ignition UI
      // is opened.

      const documentUri = editor?.document.uri;
      if (documentUri === undefined) {
        this.#currentStoryPath = undefined;
        // TODO: notify all the panels... with an event?
        return;
      }
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
      if (workspaceFolder === undefined) {
        // When can this happen?
        this.#currentStoryPath = undefined;
        throw new Error('No workspace folder found');
      }
      const analyzer = await getAnalyzer(workspaceFolder);

      const modulePath = documentUri.fsPath as AbsolutePath;
      const storiesModule = getStoriesModule(modulePath, analyzer);

      this.currentStoryPath = storiesModule?.jsPath;
      logChannel.appendLine(
        `Active text editor changed to ${this.currentStoryPath}`
      );
      logChannel.appendLine(`currentStoryPath: ${this.currentStoryPath}`);
    });
    context.subscriptions.push(disposable);

    // This command is fired by the elements view
    disposable = vscode.commands.registerCommand(
      'ignition.openElement',
      async (declaration: LitElementDeclaration) => {
        logChannel.appendLine(
          `ignition.openElement ${declaration.tagname ?? declaration.name}`
        );
      }
    );
    context.subscriptions.push(disposable);
  }

  async deactivate() {
    // Clean up any resources
    logChannel.appendLine('Deactivating Ignition');
  }
}
