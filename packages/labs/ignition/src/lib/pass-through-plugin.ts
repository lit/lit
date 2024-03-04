/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import Koa from 'koa';
import type {AbsolutePath, Analyzer, PackagePath} from '@lit-labs/analyzer';
import type {Plugin} from '@web/dev-server-core';
import vscode = require('vscode');
import {getModulePathFromJsPath} from './paths.js';
import {addSourceIds} from './source-id-transform.js';

/**
 * A Web Dev Server plugin that uses the analyzer's TypeScript to transform
 * TS files to JS, while also adding source ids to the transformed JS.
 */
export class PassThroughPlugin implements Plugin {
  readonly name = 'pass-through';
  private readonly analyzer: Analyzer;
  private readonly workspaceFolder: vscode.WorkspaceFolder;
  constructor(analyzer: Analyzer, workspaceFolder: vscode.WorkspaceFolder) {
    this.analyzer = analyzer;
    this.workspaceFolder = workspaceFolder;
  }

  transform(context: Koa.Context) {
    const result = this.getJSFromAnalyzer(context.path as PackagePath);
    if (result === undefined) {
      // Should we return just {transformCache: false} here?
      return;
    }
    return {
      body: result,
      // Tells WDS never to cache this result.
      transformCache: false,
    };
  }

  transformCacheKey(
    context: Koa.Context
  ): string | Promise<string> | Promise<undefined> | undefined {
    // There's no way to say "please don't cache this", so return a random
    // string.
    return new Date().toISOString();
  }

  // Public for testing
  getJSFromAnalyzer(jsPath: PackagePath): string | undefined {
    if (jsPath.startsWith('/node_modules/')) {
      // TODO: exclude WDS path prefixes
      return;
    }
    const filePath = (this.workspaceFolder.uri.fsPath + jsPath) as AbsolutePath;

    // Find the SourceFile
    const modulePath = getModulePathFromJsPath(this.analyzer, filePath);
    if (modulePath === undefined) {
      // File is not in TS project, so let WDS try to serve it
      return;
    }
    const sourceFile = this.analyzer.program.getSourceFile(modulePath);
    if (sourceFile === undefined) {
      // Shouldn't be possible?
      return;
    }

    // Emit
    let result: string | undefined;
    this.analyzer.program.emit(
      sourceFile,
      (
        fileName: string,
        text: string,
        _writeByteOrderMark: boolean,
        _onError?: (message: string) => void
      ) => {
        if (fileName === filePath) {
          result = text;
        }
      },
      undefined,
      undefined,
      {
        after: [
          addSourceIds(
            this.analyzer.typescript,
            this.analyzer.program.getTypeChecker()
          ),
        ],
      }
    );

    // If result is undefined… unknown problem with emit?
    return result;
  }
}
