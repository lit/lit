/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createContext} from '@lit/context';
import type {Remote} from 'comlink';
// import type {LitElement} from 'lit';
import type {ApiToWebview} from '../../frame/iframe-api-to-webview.js';
import type {IgnitionEditor} from '../ignition-editor.js';
import type {IgnitionStage} from '../ignition-stage.js';

export const stageContext = createContext<IgnitionStage>(
  Symbol('stageContext')
);

export const editorContext = createContext<IgnitionEditor>(
  Symbol('editorContext')
);

export const frameApiContext = createContext<Remote<ApiToWebview> | undefined>(
  Symbol('frameApiContext')
);

// export interface EditorModeElement extends LitElement {
//   renderToolbar?(): unknown;
// }
