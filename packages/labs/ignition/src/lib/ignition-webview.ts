/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {createRequire} from 'module';
import type {AddressInfo} from 'net';
import * as comlink from 'comlink';
import type {ApiExposedToExtension} from '@lit-labs/ignition-ui';
import {ComlinkEndpointToWebview} from './comlink-endpoint-to-webview.js';
import {getWorkspaceResources, ensureUiServerRunning} from './servers.js';
import * as path from 'node:path';
import {logChannel} from './logging.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

function getHtmlForWebview(
  uiServerPort: number,
  initialState: IgnitionWebviewState
): string {
  const uiScriptUrl = `http://localhost:${uiServerPort}/index.js`;


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
            }
            .element-container {
              width: 640px;
            }
          </style>
        </head>
        <body>
          <ignition-ui></ignition-ui>
        </body>
      </html>
    `;
}

const getStoriesModule = (modulePath: AbsolutePath, analyzer: Analyzer) => {
  // Look for a sibling module with the same name but ending in .stories.ts
  const moduleDir = path.dirname(modulePath);
  const moduleName = path.basename(modulePath, '.ts');
  const storiesModulePath = path.join(
    moduleDir,
    `${moduleName}.stories.ts`
  ) as AbsolutePath;
  try {
    logChannel.appendLine(
      `Looking for stories module for ${modulePath} at ${storiesModulePath}`
    );
    const storiesModule = analyzer.getModule(storiesModulePath);
    return storiesModule;
  } catch (e) {
    logChannel.appendLine(`Nor stories module found for ${modulePath}`);
    return undefined;
  }
};

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
  const [workspace, uiServer] = await Promise.all([
    getWorkspaceResources(workspaceFolder),
    ensureUiServerRunning(),
  ]);
  const modulePath = documentUri.fsPath as AbsolutePath;

  const storiesModule = getStoriesModule(modulePath, workspace.analyzer);

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

    const workspaceServerAddress = workspace.server.address() as AddressInfo;

    if (storiesModule !== undefined) {
      const storyUrl = `http://localhost:${workspaceServerAddress.port}/story/${storiesModule.jsPath}`;
      connection.setStoryUrl(storyUrl);
    }
  }

  // It's initially visible, so connect immediately.
  connectAndInitialize();

  return webviewPanel;
};
