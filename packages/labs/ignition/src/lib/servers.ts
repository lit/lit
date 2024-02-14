import cors from 'koa-cors';
import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {createPackageAnalyzer} from '@lit-labs/analyzer/package-analyzer.js';
import type {Server} from 'http';
import {startServer} from './project-server.js';
import * as path from 'node:path';
import wds = require('@web/dev-server');
import {DevServer} from './types.cjs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

// Map of workspace folder to dev server and analyzer. This allows very fast
// re-opening of a previous "Ignition" webview. Currently this map leaks, and is
// only cleared by refreshing vscode.
const workspaceResourcesCache = new Map<
  string,
  {server: Server; analyzer: Analyzer}
>();
const uiRoot = path.dirname(require.resolve('@lit-labs/ignition-ui'));
let _uiServer: DevServer;
export const ensureUiServerRunning = async () => {
  return (_uiServer ??= await wds.startDevServer({
    config: {
      rootDir: uiRoot,
      nodeResolve: {
        exportConditions: ['development', 'browser'],
        extensions: ['.cjs', '.mjs', '.js'],
        dedupe: () => true,
        preferBuiltins: false,
      },
      middleware: [cors({origin: '*', credentials: true})],
    },
    readCliArgs: false,
    readFileConfig: false,
  }));
};

export const getWorkspaceResources = async (
  workspaceFolder: vscode.WorkspaceFolder
) => {
  let workspaceResources = workspaceResourcesCache.get(
    workspaceFolder.uri.fsPath
  );
  if (workspaceResources === undefined) {
    const analyzer = createPackageAnalyzer(
      workspaceFolder!.uri.fsPath as AbsolutePath
    );

    const server = await startServer(analyzer);

    workspaceResources = {server, analyzer};
    workspaceResourcesCache.set(workspaceFolder.uri.fsPath, workspaceResources);
  }
  return workspaceResources;
};
