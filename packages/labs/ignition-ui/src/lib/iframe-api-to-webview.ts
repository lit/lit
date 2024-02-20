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

  async boundingBoxesAtPoint(
    x: number,
    y: number
  ): Promise<ViewportBoundingBox[]> {
    let element = document.elementFromPoint(x, y);
    if (element == null) {
      return [];
    }
    while (element.shadowRoot != null) {
      const innerElement = element.shadowRoot.elementFromPoint(x, y);
      if (innerElement == null || innerElement === element) {
        break;
      }
      element = innerElement;
    }
    let boundingRects: Iterable<DOMRect> = [element.getBoundingClientRect()];
    for (const child of element.childNodes) {
      if (child.nodeType !== Node.TEXT_NODE) {
        continue;
      }
      // We have to manually check to see if the point is in the text node
      // because elementFromPoint only returns elements.
      const range = document.createRange();
      range.selectNodeContents(child);
      const rects = range.getClientRects();
      range.detach();
      for (const rect of rects) {
        if (
          rect.left <= x &&
          x <= rect.right &&
          rect.top <= y &&
          y <= rect.bottom
        ) {
          boundingRects = rects;
          break;
        }
      }
    }
    return toViewportBoundingBoxes(boundingRects);
  }
}
export type ApiToWebview = ApiToWebviewClass;

// A bounding box that's relative to the viewport, not the page.
export interface ViewportBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  __viewportBoundingBoxBrand: never;
}

function toViewportBoundingBoxes(
  pageSpaceRects: Iterable<DOMRect>
): ViewportBoundingBox[] {
  const result = [];
  for (const rect of pageSpaceRects) {
    // We want to return the bounding box of the element in the coordinate space
    // of the viewport, not the page.
    result.push({
      x: rect.x - window.scrollX,
      y: rect.y - window.scrollY,
      width: rect.width,
      height: rect.height,
    } as unknown as ViewportBoundingBox);
  }
  return result;
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
