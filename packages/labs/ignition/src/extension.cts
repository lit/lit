/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// @ts-expect-error can't even import a type from a JS module?
import type {Ignition} from './lib/ignition.js';
import * as vscode from 'vscode';

let ignition: Ignition;

export async function activate(context: vscode.ExtensionContext) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const {Ignition} = await import('./lib/ignition.js');
  ignition = new Ignition(context);
  await ignition.activate();
}

export async function deactivate() {
  await ignition.deactivate();
}
