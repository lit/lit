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
import {logChannel} from './logging.js';
import {getProjectServer} from './project-server.js';
import {getUiServer} from './ui-server.js';
import * as path from 'node:path';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

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
  return driveWebviewPanel(webviewPanel, ignition);
};

// Sets up an already existing webview panel and starts any necessary services.
export const driveWebviewPanel = async (
  webviewPanel: vscode.WebviewPanel,
  ignition: Ignition
) => {
  const uiServer = await getUiServer();

  // If this becomes a hassle, we can just ask the webview to stay resident
  // when we create it.
  webviewPanel.onDidChangeViewState((e) => {
    logChannel.appendLine('onDidChangeViewState');
    if (e.webviewPanel.active) {
      connectAndInitialize();
    }
  });

  const webview = webviewPanel.webview;
  const uiServerAddress = uiServer.server?.address() as AddressInfo;
  webview.html = getHtmlForWebview(uiServerAddress.port);
  const api = new ApiExposedToWebview(ignition, webview);

  async function connectAndInitialize() {
    const endpoint = await ComlinkEndpointToEditor.connect(webview);
    const connection = comlink.wrap<ApiExposedToExtension>(endpoint);

    const refreshStory = async () => {
      if (ignition.currentStory === undefined) {
        connection.setStoryUrl(undefined);
        return;
      }
      const {storyPath, workspaceFolder} = ignition.currentStory;
      const projectServer = await getProjectServer(workspaceFolder);
      const projectServerAddress = projectServer.address() as AddressInfo;
      const storyUrl = `http://localhost:${projectServerAddress.port}/story/${storyPath}`;
      connection.setStoryUrl(storyUrl);
    };
    ignition.onDidChangeCurrentStory(refreshStory);
    await refreshStory();
  }

  // It's initially visible, so connect immediately.
  connectAndInitialize();

  return webviewPanel;
};

class ApiExposedToWebview {
  readonly #ignition: Ignition;
  constructor(ignition: Ignition, webview: vscode.Webview) {
    this.#ignition = ignition;
    const listener = (message: MessageFromWebviewToExtension | undefined) => {
      if (message?.kind === 'focus-source-at-location') {
        // Why is MessageFromWebviewToExtension the `any` type??
        this.focus(message.filename, message.line, message.column);
      }
    };
    webview.onDidReceiveMessage(listener);
  }
  focus(filename: string, line: number, column: number) {
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
}
