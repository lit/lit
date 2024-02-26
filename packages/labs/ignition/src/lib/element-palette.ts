/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'module';
import type {AddressInfo} from 'net';
import {getUiServer} from './ui-server.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

export class ElementPaletteViewProvider implements vscode.WebviewViewProvider {
  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const {webview} = webviewView;

    const uiServer = await getUiServer();
    const uiServerAddress = uiServer.server?.address() as AddressInfo;
    const uiServerPort = uiServerAddress.port;
    const uiScriptUrl = `http://localhost:${uiServerPort}/element-palette-entrypoint.js`;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webview.html = `<!doctype html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script type="module" src="${uiScriptUrl}"></script>
          <style>
            html, body {
              min-height: 100%;
              padding: 0;
              margin: 0;
            }
          </style>  
        </head>
        <body><ignition-element-palette></ignition-element-palette></body>
      </html>
    `;
  }
}
