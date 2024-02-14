/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This is the code that runs inside the user's iframe.

import * as comlink from 'comlink';

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

// This is the API that's accessible from the webview (our direct parent).
class ApiToWebviewClass {
  private textContainer = (() => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    div.textContent = `Waiting to connect to webview...`;
    return div;
  })();

  displayText(text: string) {
    this.textContainer.textContent = text;
  }
}
export type ApiToWebview = ApiToWebviewClass;

// Expose the API to the webview.
comlink.expose(new ApiToWebviewClass(), comlink.windowEndpoint(window));
