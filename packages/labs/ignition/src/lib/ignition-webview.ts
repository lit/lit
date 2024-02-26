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
import {getAnalyzer, getWorkspaceFolderForElement} from './analyzer.js';
import {ComlinkEndpointToWebview} from './comlink-endpoint-to-webview.js';
import {getProjectServer} from './project-server.js';
import {getStoriesModule, getStoriesModuleForElement} from './stories.js';
import type {DevServer} from './types.cjs';

const require = createRequire(import.meta.url);
import vscode = require('vscode');
import wds = require('@web/dev-server');
import {Ignition} from './ignition.js';
import {logChannel} from './logging.js';

function getHtmlForWebview(uiServerPort: number): string {
  const uiScriptUrl = `http://localhost:${uiServerPort}/webview-entrypoint.js`;

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
        </style>
      </head>
      <body><ignition-ui></ignition-ui></body>
    </html>
  `;
}

export const createWebView = async (ignition: Ignition) => {
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

  async function connectAndInitialize() {
    const endpoint = await ComlinkEndpointToWebview.connect(webview);
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

const uiRoot = path.dirname(require.resolve('@lit-labs/ignition-ui'));
let uiServerPromise: Promise<DevServer>;

export const getUiServer = async () => {
  return (uiServerPromise ??= wds
    .startDevServer({
      config: {
        nodeResolve: true,
        rootDir: path.join(uiRoot),
        middleware: [cors({origin: '*', credentials: true})],
      },
      readCliArgs: false,
      readFileConfig: false,
    })
    .then((server) => {
      const uiServerAddress = server.server?.address() as AddressInfo;
      logChannel.appendLine(`UI server started on ${uiServerAddress.port}`);
      return server;
    }));
};
