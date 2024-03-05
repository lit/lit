/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AbsolutePath, LitElementDeclaration} from '@lit-labs/analyzer';
import {createRequire} from 'module';
import {getAnalyzer, getWorkspaceFolderForElement} from './analyzer.js';
import {ElementsDataProvider} from './elements-data-provider.js';
import {logChannel} from './logging.js';
import {getStoriesModule, getStoriesModuleForElement} from './stories.js';
import {EditorWebviewSerializer} from './editor-webview-serializer.js';
import ts from 'typescript';

const require = createRequire(import.meta.url);
import vscode = require('vscode');
import {TemplateOutlineDataProvider} from './template-outline-data-provider.js';
import {ElementPaletteViewProvider} from './element-palette.js';
import {EditorPanel} from './editor-panel.js';
import {InMemoryBuffers, OverlayFilesystem} from './overlay-filesystem.js';

export interface StoryInfo {
  storyPath: string;
  workspaceFolder: vscode.WorkspaceFolder;
}

// JSON object stored in the workspaceState Memento
type StoryState =
  | undefined
  | {
      storyPath: string;
      workspaceFolderUri: string;
    };

/**
 * Holds the shared state of the Ignition extension and manages its lifecycle.
 */
export class Ignition {
  context: vscode.ExtensionContext;

  #onDidChangeCurrentElement: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeCurrentElement: vscode.Event<void> =
    this.#onDidChangeCurrentElement.event;

  #currentElement?: LitElementDeclaration;

  readonly #buffers: InMemoryBuffers;
  readonly filesystem: OverlayFilesystem;

  get currentElement() {
    return this.#currentElement!;
  }

  set currentElement(value: LitElementDeclaration | undefined) {
    this.#currentElement = value;
    this.#onDidChangeCurrentElement.fire();
  }

  #onDidChangeCurrentStory: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeCurrentStory: vscode.Event<void> =
    this.#onDidChangeCurrentStory.event;

  #currentStory?: StoryInfo;

  get currentStory() {
    return this.#currentStory;
  }

  set currentStory(value: StoryInfo | undefined) {
    this.#currentStory = value;
    this.context.workspaceState.update(
      'ignition.currentStoryState',
      value &&
        ({
          storyPath: value.storyPath,
          workspaceFolderUri: value.workspaceFolder.uri.toString(),
        } satisfies StoryState)
    );
    this.#onDidChangeCurrentStory.fire();
  }

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const {filesystem: fs, buffers} =
      OverlayFilesystem.fromUnderlyingFilesystem(ts.sys);
    this.filesystem = fs;
    this.#buffers = buffers;
  }

  async activate() {
    logChannel.appendLine('Activating Ignition');

    const {context} = this;

    // Restore the current story state from the workspace state so that when
    // the webview is restored, it can be load the current story.
    const storyState = this.context.workspaceState.get(
      'ignition.currentStoryState'
    ) as StoryState;
    logChannel.appendLine(
      `ignition.currentStoryState = ${JSON.stringify(storyState)}`
    );
    if (storyState !== undefined) {
      this.currentStory = {
        storyPath: storyState.storyPath,
        workspaceFolder: vscode.workspace.getWorkspaceFolder(
          vscode.Uri.parse(storyState.workspaceFolderUri)
        )!,
      };
    }

    // ignition.createEditor command
    let disposable = vscode.commands.registerCommand(
      'ignition.createEditor',
      async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const {EditorPanel} = await import('./editor-panel.js');
        const disposable = await EditorPanel.create(this);
        context.subscriptions.push(disposable);
      }
    );
    context.subscriptions.push(disposable);

    // ignition.newComponent command
    disposable = vscode.commands.registerCommand(
      'ignition.newComponent',
      async () => {
        const {createComponent} = await import('./component-commands.js');
        await createComponent();
      }
    );
    context.subscriptions.push(disposable);

    // ignition.newComponent command
    disposable = vscode.commands.registerCommand(
      'ignition.deleteComponent',
      async (...args) => {
        const {deleteComponent} = await import('./component-commands.js');
        await deleteComponent(this.filesystem, ...args);
      }
    );
    context.subscriptions.push(disposable);

    // Webview serializer
    const serializer = new EditorWebviewSerializer(this);
    disposable = vscode.window.registerWebviewPanelSerializer(
      EditorPanel.viewType,
      serializer
    );
    context.subscriptions.push(serializer, disposable);

    // Elements view
    const elementsDataProvider = new ElementsDataProvider(this);
    disposable = vscode.window.registerTreeDataProvider(
      'ignition-element-view',
      elementsDataProvider
    );
    context.subscriptions.push(disposable);

    // Template outline view
    const templateOutlineDataProvider = new TemplateOutlineDataProvider(this);
    disposable = vscode.window.registerTreeDataProvider(
      'ignition-template-outline',
      templateOutlineDataProvider
    );
    context.subscriptions.push(disposable);

    // Element pallete
    const elementPaletteViewProvider = new ElementPaletteViewProvider();
    disposable = vscode.window.registerWebviewViewProvider(
      'ignition-element-palette',
      elementPaletteViewProvider
    );
    context.subscriptions.push(disposable);

    // Listen for active text editor changes and set up workspace resources
    disposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      // Note: VS Code only activates the extension if there is some Ignition UI
      // open. So the expensive work here, like creating an analyzer, should
      // only be happening when it's needed to drive that UI.

      const documentUri = editor?.document.uri;
      logChannel.appendLine(
        `onDidChangeActiveTextEditor documentUri: ${documentUri}`
      );
      if (documentUri === undefined) {
        // Assume that we want to keep displaying the current story
        return;
      }
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
      if (workspaceFolder === undefined) {
        // This can happen if the user focuses a non-source file, like the
        // output pane. We'll just do nothing to not disturb the current state.
        return;
      }
      const analyzer = await getAnalyzer(workspaceFolder, this.filesystem);

      const modulePath = documentUri.fsPath as AbsolutePath;
      const storiesModule = getStoriesModule(modulePath, analyzer);

      this.currentStory =
        storiesModule === undefined
          ? undefined
          : {storyPath: storiesModule.jsPath, workspaceFolder};
    });
    context.subscriptions.push(disposable);

    // This command is fired by the elements view
    disposable = vscode.commands.registerCommand(
      'ignition.openElement',
      async (declaration: LitElementDeclaration) => {
        logChannel.appendLine(
          `ignition.openElement ${declaration.tagname ?? declaration.name}`
        );
        const workspaceFolder = getWorkspaceFolderForElement(declaration);
        const analyzer = await getAnalyzer(workspaceFolder, this.filesystem);
        const storiesModule = getStoriesModuleForElement(declaration, analyzer);
        this.currentElement = declaration;
        this.currentStory =
          storiesModule === undefined
            ? undefined
            : {storyPath: storiesModule.jsPath, workspaceFolder};
      }
    );
    context.subscriptions.push(disposable);

    // Track open files in this.#buffers, our in-memory overlay filesystem.
    disposable = vscode.workspace.onDidOpenTextDocument((document) => {
      this.#buffers.set(
        document.uri.fsPath as AbsolutePath,
        document.getText()
      );
    });
    context.subscriptions.push(disposable);

    disposable = vscode.workspace.onDidChangeTextDocument((event) => {
      this.#buffers.set(
        event.document.uri.fsPath as AbsolutePath,
        event.document.getText()
      );
    });
    context.subscriptions.push(disposable);

    // And when the user closes a file, remove it from the overlay filesystem
    disposable = vscode.workspace.onDidCloseTextDocument((document) => {
      this.#buffers.close(document.uri.fsPath as AbsolutePath);
    });
    context.subscriptions.push(disposable);
  }

  async deactivate() {
    // Clean up any resources
    logChannel.appendLine('Deactivating Ignition');
  }
}
