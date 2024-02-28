/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import './lib/webview/ignition-editor.js';
import {ApiToExtension} from './lib/webview/api-to-extension.js';
export type {ApiExposedToExtension} from './lib/webview/api-to-extension.js';
export type {MessageFromWebviewToExtension} from './lib/protocol/extension-api-to-webview.d.ts';

ApiToExtension.expose();

const dropTarget = document.body;

dropTarget.addEventListener('dragenter', (event) => {
  event.preventDefault();
  (event.target as HTMLElement).classList.add('dragoverHighlight');
});

dropTarget.addEventListener('dragleave', (event) => {
  (event.target as HTMLElement).classList.remove('dragoverHighlight');
});

dropTarget.addEventListener('dragover', (event) => {
  // accept any DnD
  event.preventDefault();
});

dropTarget.addEventListener('drop', (event) => {
  (event.target as HTMLElement).classList.remove('dragoverHighlight');
  console.log('drop', event.dataTransfer!.getData('ignition/add-element'));
});
