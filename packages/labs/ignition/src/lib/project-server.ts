/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import Router from '@koa/router';
import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import type {Server} from 'http';
import Koa from 'koa';
import cors from 'koa-cors';
import {createRequire} from 'module';
import type {AddressInfo} from 'net';
import * as path from 'path';
import {getAnalyzer} from './analyzer.js';
import {bareSpecifierTransformer} from './bare-specifier-transformer.js';
import {Deferred} from './deferred.js';
import {getUiServer} from './ignition-webview.js';
import {logChannel} from './logging.js';
import {getModulePathFromJsPath} from './paths.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

// TODO (justinfagnani): /_src/ isn't a great name. Right now it's just a
// prefix for all JS files. We're not requesting source from the server, but
// built files.
const baseUrl = '/_src/';

const startServer = async (uiServerPort: number, analyzer: Analyzer) => {
  const app = new Koa();
  app.use(cors({origin: '*', credentials: true}));

  const router = new Router();

  router.get(`${baseUrl}:jsPath*`, async (context) => {
    const jsPath = ('/' + context.params.jsPath) as AbsolutePath;
    const modulePath = getModulePathFromJsPath(analyzer, jsPath);

    if (modulePath) {
      // TODO (justinfagnani): This is where project-specific transformations
      // should be applied. Right now modulePath is always undefined, so this
      // code path is never taken.
      const sourceFile = analyzer.program.getSourceFile(modulePath);

      const emittedFiles: Array<{fileName: string; text: string}> = [];

      const emitResult = analyzer.program.emit(
        sourceFile,
        (fileName: string, text: string) => {
          emittedFiles.push({fileName, text});
        },
        undefined,
        false,
        {
          after: [bareSpecifierTransformer(analyzer, baseUrl)],
        }
      );
      if (emitResult.diagnostics.length > 0) {
        // TODO (justinfagnani): handle diagnostics?
      }

      const jsFile = emittedFiles.filter((f) => f.fileName.endsWith('.js'))[0];
      const jsOutput = jsFile?.text;

      context.body = jsOutput;
      context.type = 'text/javascript';
      return;
    } else {
      // File is not part of the program, likely a dependency
      const pkg = analyzer.getPackage();
      const root = pkg.rootDir;
      const modulePath = path.resolve(root, '.' + jsPath);
      const source = await analyzer.fs.readFile(modulePath, 'utf-8');
      if (source === undefined) {
        context.status = 404;
        context.body = `Could not read file at ${modulePath}`;
        return;
      }
      const result = analyzer.typescript.transpileModule(source, {
        fileName: modulePath,
        compilerOptions: {
          module: analyzer.typescript.ModuleKind.ESNext,
          target: analyzer.typescript.ScriptTarget.ESNext,
        },
        transformers: {
          after: [bareSpecifierTransformer(analyzer, baseUrl)],
        },
      });
      context.body = result.outputText;
      context.type = 'text/javascript';
      return;
    }
  });

  router.get('/story/:path', async (context, next) => {
    const path = context.params.path;
    // Split pathAndName into a story file path and story name
    // const [storyPath, storyName] = pathAndName.split(':');
    const storyPath = path;
    const storySrc = `http://localhost:${port}${baseUrl}${storyPath}`;

    const serverUrl = server.address();

    logChannel.appendLine(`serverUrl: ${serverUrl}`);
    logChannel.appendLine(`Story path: ${storyPath}`);
    logChannel.appendLine(`Story path: ${storySrc}`);

    context.body = /* html */ `
      <!doctype html>
      <html>
        <head>
          <script type='module' src='http://localhost:${uiServerPort}/frame-entrypoint.js'></script>
          <style id="_defaultStyles"></style>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <ignition-storyboard src=${storySrc}></ignition-storyboard>
        </body>
      </html>
    `;
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  const server = app.listen();
  const address = server.address();
  const port = typeof address === 'string' ? address : address?.port;
  logChannel.appendLine(`Ignition project server started at ${port}`);
  return server;
};

const serverCache = new Map<string, Deferred<Server>>();

export const getProjectServer = async (
  workspaceFolder: vscode.WorkspaceFolder
) => {
  let serverDeferred = serverCache.get(workspaceFolder.uri.fsPath);
  if (serverDeferred === undefined) {
    serverDeferred = new Deferred<Server>();
    // Must be before first await to avoid races
    serverCache.set(workspaceFolder.uri.fsPath, serverDeferred);

    try {
      // Even though getWorkspaceAnalyzer() is synchronous, using Promise.all()
      // lets it run while the server is starting.
      const [uiServer, analyzer] = await Promise.all([
        getUiServer(),
        getAnalyzer(workspaceFolder),
      ]);

      const uiServerAddress = uiServer.server?.address() as AddressInfo;

      const server = await startServer(uiServerAddress.port, analyzer);
      serverDeferred.resolve(server);
    } catch (e) {
      serverDeferred.reject(e as Error);
    }
  }
  return serverDeferred.promise;
};
