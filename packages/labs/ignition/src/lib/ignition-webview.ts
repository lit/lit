/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {AbsolutePath} from '@lit-labs/analyzer';
import type {ApiExposedToExtension} from '@lit-labs/ignition-ui';
import * as comlink from 'comlink';
import cors from 'koa-cors';
import {createRequire} from 'module';
import type {AddressInfo} from 'net';
import * as path from 'node:path';
import {getAnalyzer} from './analyzer.js';
import {ComlinkEndpointToWebview} from './comlink-endpoint-to-webview.js';
import {getProjectServer} from './project-server.js';
import {getStoriesModule} from './stories.js';
import type {DevServer} from './types.cjs';

const require = createRequire(import.meta.url);
import vscode = require('vscode');
import wds = require('@web/dev-server');

function getHtmlForWebview(
  uiServerPort: number,
  initialState: IgnitionWebviewState
): string {
  const uiScriptUrl = `http://localhost:${uiServerPort}/webview-entrypoint.js`;

  return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
        <script type="module" src="${uiScriptUrl}"></script>
        <script type="json" id="state">
          ${JSON.stringify(initialState)}
        </script>
        <style>
          html, body {
            min-height: 100%;
            padding: 0;
            margin: 0;
          }
        </style>
      </head>
      <body><ignition-ui></ignition-ui></body>
    </html>
  `;
}

export const createWebView = async () => {
  const documentUri = vscode.window.activeTextEditor?.document.uri;
  if (documentUri === undefined) {
    // Can we do something better here? Infer a story from the workspace?
    return;
  }
  const webviewPanel = vscode.window.createWebviewPanel(
    'ignition',
    'Ignition',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
    }
  );
  return driveWebviewPanel(webviewPanel, documentUri);
};

// Sets up an already existing webview panel and starts any necessary services.
export const driveWebviewPanel = async (
  webviewPanel: vscode.WebviewPanel,
  documentUri: vscode.Uri
) => {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
  if (workspaceFolder === undefined) {
    throw new Error('No workspace folder found');
  }
  const [analyzer, uiServer, projectServer] = await Promise.all([
    getAnalyzer(workspaceFolder),
    getUiServer(),
    getProjectServer(workspaceFolder),
  ]);
  const modulePath = documentUri.fsPath as AbsolutePath;

  const storiesModule = getStoriesModule(modulePath, analyzer);

  // If this becomes a hassle, we can just ask the webview to stay resident
  // when we create it.
  webviewPanel.onDidChangeViewState((e) => {
    if (e.webviewPanel.active) {
      connectAndInitialize();
    }
  });

  const webview = webviewPanel.webview;
  const uiServerAddress = uiServer.server?.address() as AddressInfo;
  webview.html = getHtmlForWebview(uiServerAddress.port, {modulePath});

  async function connectAndInitialize() {
    const webview = webviewPanel.webview;
    const endpoint = await ComlinkEndpointToWebview.connect(webview);
    const connection = comlink.wrap<ApiExposedToExtension>(endpoint);

    const workspaceServerAddress = projectServer.address() as AddressInfo;

    if (storiesModule !== undefined) {
      const storyUrl = `http://localhost:${workspaceServerAddress.port}/story/${storiesModule.jsPath}`;
      connection.setStoryUrl(storyUrl);
    }
  }

  // It's initially visible, so connect immediately.
  connectAndInitialize();

  return webviewPanel;
};

const uiRoot = path.dirname(require.resolve('@lit-labs/ignition-ui'));
let uiServerPromise: Promise<DevServer>;

export const getUiServer = async () => {
  return (uiServerPromise ??= wds.startDevServer({
    config: {
      nodeResolve: true,
      rootDir: path.join(uiRoot),
      middleware: [cors({origin: '*', credentials: true})],
    },
    readCliArgs: false,
    readFileConfig: false,
  }));
};
