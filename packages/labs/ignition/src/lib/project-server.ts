/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import cors from 'koa-cors';
import Koa from 'koa';
import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {bareSpecifierTransformer} from './bare-specifier-transformer.js';
import {getModulePathFromJsPath} from './paths.js';
import * as path from 'path';
import {logChannel} from './logging.js';
import Router from '@koa/router';

// TODO (justinfagnani): /_src/ isn't a great name. Right now it's just a
// prefix for all JS files. We're not requesting source from the server, but
// built files.
const baseUrl = '/_src/';

export const startServer = async (uiServerPort: number, analyzer: Analyzer) => {
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
          <script type='module' src='http://localhost:${uiServerPort}/in-user-iframe.js'></script>
<<<<<<< HEAD
          <script type='module' src='http://localhost:${uiServerPort}/lib/frame/ignition-storyboard.js'></script>
=======
          <script type='module' src='http://localhost:${uiServerPort}/lib/ignition-storyboard.js'></script>
          <style>
            body, html {
              margin: 0;
              width: 100%;
              height: 100%;
            }
          </style>
>>>>>>> 624655e2 (Improve story styling)
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
