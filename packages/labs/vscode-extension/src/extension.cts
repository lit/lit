/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {LitExtension} from './lib/lit-extension.js';
import type vscode from 'vscode';

let litExtension: LitExtension;

export async function activate(context: vscode.ExtensionContext) {
  // This must be a dynamic import. Even though Node supports require(esm) now,
  // Electron will error if we try to use static imports.
  const {LitExtension} = await import('./lib/lit-extension.js');
  litExtension = new LitExtension(context);
  await litExtension.activate();
}

export async function deactivate() {
  await litExtension.deactivate();
}
