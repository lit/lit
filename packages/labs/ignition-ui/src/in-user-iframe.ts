/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This is the code that runs inside the user's iframe.

import {exposeApiToWebview} from './lib/frame/iframe-api-to-webview.js';

// Opt into Lit debug logging, causing Lit to keep track of more info about
// its templates that we can use.
// We might want to make this more fine grained, as we might only care about
// getting source information rather than all the debug logging.
{
  interface DebugLoggingWindow {
    emitLitDebugLogEvents?: boolean;
  }

  const debugLoggingWindow = window as DebugLoggingWindow;
  debugLoggingWindow.emitLitDebugLogEvents = true;
}

// Expose our API to the webview.
await exposeApiToWebview();
