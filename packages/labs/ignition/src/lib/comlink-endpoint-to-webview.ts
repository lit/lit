/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as comlink from 'comlink';
import type vscode = require('vscode');

/** Uses the vscode Webview API for sending comlink messages. */
export class ComlinkEndpointToWebview implements comlink.Endpoint {
  private readonly webview: vscode.Webview;
  private readonly handlerToDisposable = new Map<
    EventListenerOrEventListenerObject,
    vscode.Disposable
  >();
  private constructor(webview: vscode.Webview) {
    this.webview = webview;
  }

  static async connect(webview: vscode.Webview) {
    await new Promise<void>((resolve) => {
      const disposable = webview.onDidReceiveMessage((message) => {
        if (message?.kind === 'ignition-webview-ready') {
          disposable.dispose();
          resolve();
        }
      });
    });
    return new ComlinkEndpointToWebview(webview);
  }

  postMessage(message: unknown, _t?: unknown): void {
    this.webview.postMessage(message);
  }
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {} | undefined
  ): void {
    if (this.handlerToDisposable.has(listener)) {
      return;
    }
    const disposable = this.webview.onDidReceiveMessage((message) => {
      if (typeof listener === 'function') {
        listener(message);
      } else {
        listener.handleEvent(message);
      }
    });
    this.handlerToDisposable.set(listener, disposable);
  }
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: {} | undefined
  ): void {
    this.handlerToDisposable.get(listener)?.dispose();
    this.handlerToDisposable.delete(listener);
  }
}

interface EventListener {
  (evt: Event): void;
}
interface EventListenerObject {
  handleEvent(object: Event): void;
}
type EventListenerOrEventListenerObject = EventListener | EventListenerObject;
