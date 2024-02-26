/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {
  AbsolutePath,
  Analyzer,
  LitElementDeclaration,
} from '@lit-labs/analyzer';
import * as path from 'node:path';
import {logChannel} from './logging.js';
import {get} from 'node:http';
import {getDocumentUriForElement} from './analyzer.js';

export const getStoriesModule = (
  modulePath: AbsolutePath,
  analyzer: Analyzer
) => {
  // Look for a sibling module with the same name but ending in .stories.ts
  const moduleDir = path.dirname(modulePath);
  const moduleName = path.basename(modulePath, '.ts');
  const storiesModulePath = path.join(
    moduleDir,
    `${moduleName}.stories.ts`
  ) as AbsolutePath;
  try {
    logChannel.appendLine(
      `Looking for stories module for ${modulePath} at ${storiesModulePath}`
    );
    const storiesModule = analyzer.getModule(storiesModulePath);
    return storiesModule;
  } catch (e) {
    logChannel.appendLine(`No stories module found for ${modulePath}`);
    return undefined;
  }
};

export const getStoriesModuleForElement = (
  element: LitElementDeclaration,
  analyzer: Analyzer
) => {
  const elementDocumentUri = getDocumentUriForElement(element);
  const modulePath = elementDocumentUri.fsPath as AbsolutePath;
  const storiesModule = getStoriesModule(modulePath, analyzer);
  return storiesModule;
};
