import cors from 'koa-cors';
import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {createPackageAnalyzer} from '@lit-labs/analyzer/package-analyzer.js';
import {createRequire} from 'module';
import type {Server} from 'http';
import {startServer} from './project-server.js';
import {AddressInfo} from 'net';
import * as path from 'path';

const require = createRequire(import.meta.url);

import vscode = require('vscode');
import wds = require('@web/dev-server');
import {DevServer} from './types.cjs';

const {startDevServer} = wds;

// Map of workspace folder to dev server and analyzer
const workspaceResourcesCache = new Map<
  string,
  {server: Server; analyzer: Analyzer}
>();

const uiRoot = path.dirname(require.resolve('@lit-labs/ignition-ui'));
let _uiServer: DevServer;
const startUiServer = async () => {
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

export class LitModuleEditorProvider
  implements vscode.CustomTextEditorProvider
{
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new LitModuleEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      LitModuleEditorProvider.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = 'ignition.lit-module-editor';

  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

    const {server, analyzer} = await getWorkspaceResources(workspaceFolder!);

    await startUiServer();

    webviewPanel.webview.html = this.getHtmlForWebview(
      document,
      workspaceFolder,
      analyzer,
      server
    );
  }

  private getHtmlForWebview(
    document: vscode.TextDocument,
    workspaceFolder: vscode.WorkspaceFolder | undefined,
    analyzer: Analyzer,
    server: Server
  ): string {
    const modulePath = document.uri.fsPath;
    const module = analyzer.getModule(modulePath as AbsolutePath);
    const elements = module.getCustomElementExports();
    const server2Address = server.address() as AddressInfo;
    const {port} = server2Address;

    const scriptUrl = `http://localhost:${port}/_src/${module.jsPath}`;
    const uiScriptUrl = `http://localhost:${3333}/index.js`;

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
        <script type="module" src="${uiScriptUrl}"></script>
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
            fileName: ${document.fileName}
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
}
