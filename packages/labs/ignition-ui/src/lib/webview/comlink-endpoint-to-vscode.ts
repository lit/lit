/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as comlink from 'comlink';
import type {WebviewApi} from 'vscode-webview';

/** Uses the weird vscode postmessage API to connect with the extension. */
class ComlinkEndpointToVscode implements comlink.Endpoint {
  readonly #vscode: WebviewApi<unknown>;

  constructor(webviewApi: WebviewApi<unknown>) {
    this.#vscode = webviewApi;
  }

  postMessage(
    message: unknown,
    transferrables?: Transferable[] | undefined
  ): void {
    if (transferrables != null && transferrables.length > 0) {
      throw new Error(`VSCode doesn't support transferrables.`);
    }
    this.#vscode.postMessage(message);
  }

  addEventListener(
    _type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {} | undefined
  ): void {
    window.addEventListener(
      'message',
      (message) => {
        if (typeof listener === 'function') {
          listener(message);
        } else {
          listener.handleEvent(message);
        }
      },
      options
    );
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {} | undefined
  ): void {
    window.removeEventListener(type, listener, options);
  }
}

export const vscode = acquireVsCodeApi();
const endpoint = new ComlinkEndpointToVscode(vscode);
export function expose(obj: unknown) {
  comlink.expose(obj, endpoint);
  vscode.postMessage({kind: 'ignition-webview-ready'});
}

export function wrap<T>() {
  return comlink.wrap<T>(endpoint);
}
