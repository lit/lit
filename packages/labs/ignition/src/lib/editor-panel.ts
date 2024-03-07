/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {
  ApiExposedToExtension,
  MessageFromWebviewToExtension,
} from '@lit-labs/ignition-ui';
import * as comlink from 'comlink';
import {createRequire} from 'module';
import type {AddressInfo} from 'net';
import {ComlinkEndpointToEditor} from './comlink-endpoint-to-editor.js';
import {Ignition} from './ignition.js';
import {getProjectServer} from './project-server.js';
import {getUiServer} from './ui-server.js';
import * as path from 'node:path';

const require = createRequire(import.meta.url);
import vscode = require('vscode');
import type {TemplatePiece} from '../../../ignition-ui/unbundled/lib/protocol/common.js';

function getHtmlForWebview(uiServerPort: number): string {
  const uiScriptUrl = `http://localhost:${uiServerPort}/editor-entrypoint.js`;

  return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
        <script type="module" src="${uiScriptUrl}"></script>
        <style>
          html, body {
            min-height: 100%;
            padding: 0;
            margin: 0;
          }
          .dragoverHighlight {
            background-color: var(--vscode-inputValidation-warningBackground);
          }
        </style>
      </head>
      <body><ignition-editor></ignition-editor></body>
    </html>
  `;
}

export const createEditorView = async (ignition: Ignition) => {
  const webviewPanel = vscode.window.createWebviewPanel(
    'ignition',
    'Ignition',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
    }
  );
  return EditorPanel.fromExistingPanel(webviewPanel, ignition);
};

export class EditorPanel implements vscode.Disposable {
  static readonly viewType = 'ignition';

  #onDidDispose: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  onDidDispose = this.#onDidDispose.event;

  static async create(ignition: Ignition) {
    const webviewPanel = vscode.window.createWebviewPanel(
      this.viewType,
      'Ignition',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
      }
    );
    return this.fromExistingPanel(webviewPanel, ignition);
  }

  static async fromExistingPanel(
    webviewPanel: vscode.WebviewPanel,
    ignition: Ignition
  ) {
    const uiServer = await getUiServer();
    const uiServerAddress = uiServer.server?.address() as AddressInfo;
    return new EditorPanel(webviewPanel, ignition, uiServerAddress);
  }

  readonly #webviewPanel;
  readonly #ignition;
  private autoChangeStoryUrl = true;
  #connection: comlink.Remote<ApiExposedToExtension> | undefined;
  constructor(
    webviewPanel: vscode.WebviewPanel,
    ignition: Ignition,
    uiServerAddress: AddressInfo
  ) {
    this.#webviewPanel = webviewPanel;
    this.#ignition = ignition;
    const webview = webviewPanel.webview;
    webview.html = getHtmlForWebview(uiServerAddress.port);
    const api = new ApiExposedToWebview(ignition, webview);
    api.onDidChangeAutoChangeStoryUrl((autoChangeStoryUrl: boolean) => {
      this.autoChangeStoryUrl = autoChangeStoryUrl;
      if (this.autoChangeStoryUrl) {
        this.refreshStory();
      }
    });
    ignition.onDidChangeCurrentStory(() => {
      this.ignitionStoryChanged();
    });
    ignition.onAnalyzerMayHaveNewInfo(() => {
      // Reload the frame, allowing the project server to serve new content.
      this.#connection?.reloadFrame();
    });
    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        this.#connectAndInitialize();
      }
    });
    this.#connectAndInitialize();
    webviewPanel.onDidDispose(() => {
      this.#onDidDispose.fire();
    });
    ignition.registerIgnitionEditor(this);
  }

  dispose() {
    this.#webviewPanel.dispose();
  }

  highlightTemplatePiece(templatePiece: TemplatePiece | undefined) {
    this.#connection?.highlightTemplatePiece(templatePiece);
  }

  private async refreshStory() {
    const connection = this.#connection;
    if (connection === undefined) {
      return;
    }
    if (this.#ignition.currentStory === undefined) {
      connection.setStoryUrl(undefined);
      return;
    }
    const {storyPath, workspaceFolder} = this.#ignition.currentStory;
    const projectServer = await getProjectServer(
      workspaceFolder,
      this.#ignition.filesystem
    );
    const projectServerAddress = projectServer.address() as AddressInfo;
    const storyUrl = `http://localhost:${projectServerAddress.port}/story/${storyPath}`;
    connection.setStoryUrl(storyUrl);
  }

  #connectionId = 0;
  async #connectAndInitialize() {
    this.#connectionId++;
    const connectionId = this.#connectionId;
    const endpoint = await ComlinkEndpointToEditor.connect(
      this.#webviewPanel.webview
    );
    const connection = comlink.wrap<ApiExposedToExtension>(endpoint);
    if (connectionId !== this.#connectionId) {
      return; // This connection is stale.
    }
    this.#connection = connection;
    await this.refreshStory();
  }

  private async ignitionStoryChanged() {
    if (this.autoChangeStoryUrl) {
      await this.refreshStory();
    }
  }
}

class ApiExposedToWebview {
  readonly #ignition: Ignition;
  readonly #onDidChangeAutoChangeStoryUrl: vscode.EventEmitter<boolean> =
    new vscode.EventEmitter<boolean>();
  readonly onDidChangeAutoChangeStoryUrl: vscode.Event<boolean> =
    this.#onDidChangeAutoChangeStoryUrl.event;
  constructor(ignition: Ignition, webview: vscode.Webview) {
    this.#ignition = ignition;
    const listener = (message: MessageFromWebviewToExtension | undefined) => {
      switch (message?.kind) {
        case 'focus-source-at-location':
          this.#focus(message.filename, message.line, message.column);
          break;
        case 'set-auto-change-story-url':
          this.#setAutoChangeStoryUrl(message.autoChangeStoryUrl);
          break;
        case 'edit':
          this.#ignition.applyEdit(message.edit);
          break;
      }
    };
    webview.onDidReceiveMessage(listener);
  }

  #focus(filename: string, line: number, column: number) {
    const story = this.#ignition.currentStory;
    if (story === undefined) {
      return;
    }
    const workspacePath = story.workspaceFolder.uri.fsPath;
    vscode.window.showTextDocument(
      vscode.Uri.file(path.join(workspacePath, filename)),
      {
        selection: new vscode.Range(
          new vscode.Position(line, column),
          new vscode.Position(line, column)
        ),
        viewColumn: vscode.ViewColumn.One,
      }
    );
  }

  #setAutoChangeStoryUrl(autoChangeStoryUrl: boolean) {
    this.#onDidChangeAutoChangeStoryUrl.fire(autoChangeStoryUrl);
  }
}
