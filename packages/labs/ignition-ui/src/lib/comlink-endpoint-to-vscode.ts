/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as comlink from 'comlink';
import type {WebviewApi} from 'vscode-webview';

/** Uses the weird vscode postmessage API to connect with the extension. */
class ComlinkEndpointToVscode implements comlink.Endpoint {
  private readonly webviewApi: WebviewApi<unknown>;

  constructor(webviewApi: WebviewApi<unknown>) {
    this.webviewApi = webviewApi;
  }

  postMessage(
    message: unknown,
    transferrables?: Transferable[] | undefined
  ): void {
    if (transferrables != null && transferrables.length > 0) {
      throw new Error(`VSCode doesn't support transferrables.`);
    }
    this.webviewApi.postMessage(message);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {} | undefined
  ): void {
    window.addEventListener(type, listener, options);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {} | undefined
  ): void {
    window.removeEventListener(type, listener, options);
  }
}

export function expose(vscode: WebviewApi<unknown>, obj: unknown) {
  comlink.expose(obj, new ComlinkEndpointToVscode(vscode));
  vscode.postMessage({kind: 'ignition-webview-ready'});
}
