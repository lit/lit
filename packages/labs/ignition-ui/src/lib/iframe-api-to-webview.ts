/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as comlink from 'comlink';
import './lib/comlink-stream.js';

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

  async boundingBoxesOfMouseovered(): Promise<BoundingBoxStream> {
    return new BoundingBoxStream();
  }

  async boundingBoxesAtPoint(x: number, y: number): Promise<BoundingBox[]> {
    const element = document.elementFromPoint(x, y);
    if (element == null) {
      return [];
    }
    const {
      x: elementX,
      y: elementY,
      width,
      height,
    } = element.getBoundingClientRect();
    return [{x: elementX, y: elementY, width, height}];
  }
}
export type ApiToWebview = ApiToWebviewClass;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Disposable {
  dispose(): void;
}
class BoundingBoxStream extends ReadableStream<BoundingBox[]> {
  constructor() {
    const disposables: Disposable[] = [];
    let previousElement: Element | null = null;
    super({
      async start(controller) {
        const handler = (event: MouseEvent) => {
          console.log('got a mousemove inside the iframe');
          const element = document.elementFromPoint(
            event.clientX,
            event.clientY
          );
          if (element === previousElement) {
            return;
          }
          previousElement = element;
          const boxes = [];
          if (element != null) {
            const {x, y, width, height} = element.getBoundingClientRect();
            boxes.push({x, y, width, height});
          }
          console.log(`sending ${boxes.length} boxes to the webview`);
          controller.enqueue(boxes);
        };
        window.addEventListener('mousemove', handler);
        console.log('added mousemove listener');
        disposables.push({
          dispose() {
            window.removeEventListener('mousemove', handler);
          },
        });
      },
      cancel() {
        for (const disposable of disposables) {
          disposable.dispose();
        }
      },
    });
  }
}

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

let exposed = false;
/**
 * Called inside the iframe to expose its API to the webview over a comlink
 * postmessage channel.
 */
export async function exposeApiToWebview() {
  if (exposed) {
    throw new Error('Already exposed');
  }
  exposed = true;
  const api = new ApiToWebviewClass();
  const endpoint = await getPortToWebview();
  comlink.expose(api, endpoint);
}
