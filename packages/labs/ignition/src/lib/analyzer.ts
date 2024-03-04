/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {
  AbsolutePath,
  Analyzer,
  LitElementDeclaration,
} from '@lit-labs/analyzer';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
import vscode = require('vscode');
import {OverlayFilesystem} from './overlay-filesystem.js';
import {createUpdatingPackageAnalyzer} from '@lit-labs/analyzer/package-analyzer.js';

// Map of workspace folder to package analyzer. Currently this map leaks, and is
// only cleared by refreshing vscode.
const analyzerCache = new Map<string, Analyzer>();

export const getAnalyzer = (
  workspaceFolder: vscode.WorkspaceFolder,
  fs: OverlayFilesystem
) => {
  let analyzer = analyzerCache.get(workspaceFolder.uri.fsPath);
  if (analyzer === undefined) {
    analyzer = createUpdatingPackageAnalyzer(
      workspaceFolder!.uri.fsPath as AbsolutePath,
      {fs}
    );
    analyzerCache.set(workspaceFolder.uri.fsPath, analyzer);
  }
  return analyzer;
};

export const getDocumentUriForElement = (element: LitElementDeclaration) => {
  return vscode.Uri.file(element.node.getSourceFile().fileName);
};

export const getWorkspaceFolderForElement = (
  element: LitElementDeclaration
) => {
  const elementDocumentUri = getDocumentUriForElement(element);
  const workspaceFolder =
    vscode.workspace.getWorkspaceFolder(elementDocumentUri);
  if (workspaceFolder === undefined) {
    throw new Error(
      `No workspace folder found for element ${elementDocumentUri}`
    );
  }
  return workspaceFolder;
};
