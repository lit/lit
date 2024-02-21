/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This is the code that runs inside the user's iframe.

import * as comlink from 'comlink';
import './lib/comlink-stream.js';

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
  #textContainer = (() => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    div.textContent = `Waiting to connect to webview...`;
    return div;
  })();

  displayText(text: string) {
    this.#textContainer.textContent = text;
  }

  async countingStream(): Promise<ReadableStream<number>> {
    return new CountingStream();
  }
}

class CountingStream extends ReadableStream<number> {
  constructor() {
    let i = 0;
    super({
      async pull(controller) {
        controller.enqueue(i++);
      },
      cancel() {
        console.log('CountingStream canceled');
      },
    });
  }
}

export type ApiToWebview = ApiToWebviewClass;

function getPortToWebview(): Promise<MessagePort> {
  return new Promise<MessagePort>((resolve) => {
    const handler = (event: MessageEvent) => {
      console.log(`got message from webview: ${event.data}`);
      if (event.data === 'ignition-webview-port') {
        const port = event.ports[0];
        if (port == null) {
          throw new Error('Expected a port');
        }

        resolve(port);
        window.removeEventListener('message', handler);
      }
    };
    window.addEventListener('message', handler);
  });
}

// Expose the API to the webview.
const api = new ApiToWebviewClass();
const endpoint = await getPortToWebview();
comlink.expose(api, endpoint);
