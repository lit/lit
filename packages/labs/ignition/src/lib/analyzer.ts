/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {createPackageAnalyzer} from '@lit-labs/analyzer/package-analyzer.js';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

// Map of workspace folder to package analyzer. Currently this map leaks, and is
// only cleared by refreshing vscode.
const analyzerCache = new Map<string, Analyzer>();

export const getAnalyzer = (workspaceFolder: vscode.WorkspaceFolder) => {
  let analyzer = analyzerCache.get(workspaceFolder.uri.fsPath);
  if (analyzer === undefined) {
    analyzer = createPackageAnalyzer(
      workspaceFolder!.uri.fsPath as AbsolutePath
    );
    analyzerCache.set(workspaceFolder.uri.fsPath, analyzer);
  }
  return analyzer;
};
