/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import cors from 'koa-cors';
import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {createPackageAnalyzer} from '@lit-labs/analyzer/package-analyzer.js';
import {createRequire} from 'module';
import type {Server} from 'http';
import {startServer} from './project-server.js';
import {AddressInfo} from 'net';
import * as path from 'path';
import * as comlink from 'comlink';
import type {ApiExposedToExtension} from '@lit-labs/ignition-ui';

const require = createRequire(import.meta.url);

import vscode = require('vscode');
import wds = require('@web/dev-server');
import {DevServer} from './types.cjs';
import {ComlinkEndpointToWebview} from './comlink-endpoint-to-webview.js';

const {startDevServer} = wds;

// Map of workspace folder to dev server and analyzer. This allows very fast
// re-opening of a previous "Ignition" webview. Currently this map leaks, and is
// only cleared by refreshing vscode.
const workspaceResourcesCache = new Map<
  string,
  {server: Server; analyzer: Analyzer}
>();

const uiRoot = path.dirname(require.resolve('@lit-labs/ignition-ui'));
let _uiServer: DevServer;
const ensureUiServerRunning = async () => {
  return (_uiServer ??= await startDevServer({
    config: {
      rootDir: uiRoot,
      nodeResolve: {
        exportConditions: ['development', 'browser'],
        extensions: ['.cjs', '.mjs', '.js'],
        dedupe: () => true,
        preferBuiltins: false,
      },
      port: 3333,
      middleware: [cors({origin: '*', credentials: true})],
    },
    readCliArgs: false,
    readFileConfig: false,
  }));
};

const getWorkspaceResources = async (
  workspaceFolder: vscode.WorkspaceFolder
) => {
  let workspaceResources = workspaceResourcesCache.get(
    workspaceFolder.uri.fsPath
  );
  if (workspaceResources === undefined) {
    const analyzer = createPackageAnalyzer(
      workspaceFolder!.uri.fsPath as AbsolutePath
    );

    const server = await startServer(analyzer, 3334);

    workspaceResources = {server, analyzer};
    workspaceResourcesCache.set(workspaceFolder.uri.fsPath, workspaceResources);
  }
  return workspaceResources;
};

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
          <h1>Lit Editor</h1>
        </body>
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

// Sets up the webview panel and starts any necessary services.
export const driveWebviewPanel = async (
  webviewPanel: vscode.WebviewPanel,
  documentUri: vscode.Uri
) => {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
  if (workspaceFolder === undefined) {
    throw new Error('No workspace folder found');
  }
  const [{server, analyzer}, uiServer] = await Promise.all([
    getWorkspaceResources(workspaceFolder),
    ensureUiServerRunning(),
  ]);
  const modulePath = documentUri.fsPath as AbsolutePath;

  const webview = webviewPanel.webview;
  const uiServerAddress = uiServer.server?.address() as AddressInfo;
  webview.html = getHtmlForWebview(uiServerAddress.port, {modulePath});

  ComlinkEndpointToWebview.connect(webview).then((endpoint) => {
    const connection = comlink.wrap<ApiExposedToExtension>(endpoint);
    connection.displayText('The extension has connected to the webview.');

    const server2Address = server.address() as AddressInfo;
    const {port} = server2Address;
    const module = analyzer.getModule(modulePath);
    const elements = module.getCustomElementExports();
    const scriptUrl = `http://localhost:${port}/_src/${module.jsPath}`;

    for (const element of elements) {
      connection.createStoryIframe({
        tagname: element.tagname,
        scriptUrl: scriptUrl,
        id: element.tagname,
      });
    }
  });
  return webviewPanel;
};
