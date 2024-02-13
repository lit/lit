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
  documentUri: vscode.Uri,
  workspaceFolder: vscode.WorkspaceFolder | undefined,
  analyzer: Analyzer,
  server: Server
): string {
  const modulePath = documentUri.fsPath as AbsolutePath;
  const module = analyzer.getModule(modulePath);
  const elements = module.getCustomElementExports();
  const server2Address = server.address() as AddressInfo;
  const {port} = server2Address;

  const scriptUrl = `http://localhost:${port}/_src/${module.jsPath}`;
  const uiScriptUrl = `http://localhost:${3333}/index.js`;

  const initialState: IgnitionWebviewState = {modulePath};

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
          <pre>
            workspaceFolder: ${workspaceFolder?.uri}
            fileName: ${documentUri.fsPath}
            jsPath: ${module.jsPath}
            scriptUrl: ${scriptUrl}
            elements: ${elements.map((e) => e.tagname)}
            server2: ${server2Address.address}:${server2Address.port}
          </pre>
          <test-element></test-element>
          <main>
            ${elements
              .map(
                (e) =>
                  `<iframe srcdoc="&lt;!doctype html>&lt;script type='module' src='${scriptUrl}'>&lt;/script>&lt;${e.tagname}>&lt;/${e.tagname}>"></iframe>`
              )
              .join('')}
          </main>
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
  const [{server, analyzer}] = await Promise.all([
    getWorkspaceResources(workspaceFolder!),
    ensureUiServerRunning(),
  ]);

  const webview = webviewPanel.webview;
  webview.html = getHtmlForWebview(
    documentUri,
    workspaceFolder,
    analyzer,
    server
  );

  ComlinkEndpointToWebview.connect(webview).then((endpoint) => {
    const connection = comlink.wrap<ApiExposedToExtension>(endpoint);
    connection.displayText('The extension has connected to the webview.');
  });
  return webviewPanel;
};
