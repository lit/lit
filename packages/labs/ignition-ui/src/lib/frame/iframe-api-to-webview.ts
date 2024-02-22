/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as comlink from 'comlink';
import '../protocol/comlink-stream.js';

// Container for styles copied from the webview
const defautlStylesElement = document.createElement('style');
defautlStylesElement.id = '_defaultStyles';
document.head.appendChild(defautlStylesElement);

// This is the API that's accessible from the webview (our direct parent).
class ApiToWebviewClass {
  boundingBoxesAtPoint(x: number, y: number): BoundingBoxWithDepth[] {
    let element = document.elementFromPoint(x, y);
    if (element == null) {
      return [];
    }
    let depth = 0;
    // elementFromPoint stops at shadow root boundaries, so we need to
    // go deeper in order to find the most specific element at the point.
    while (element.shadowRoot != null) {
      const innerElement = element.shadowRoot.elementFromPoint(x, y);
      if (innerElement == null || innerElement === element) {
        break;
      }
      element = innerElement;
      depth++;
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
    return toViewportBoundingBoxes(boundingRects).map((boundingBox) => {
      return {boundingBox, depth};
    });
  }

  /**
   * Sets the "environment styles" - styles that VS Code sets up in the webview
   * for the base VS Code look and feel and the current theme
   *
   * @param rootStyle the contents of the style attribute on the root
   *   <html> element.
   * @param defaultStyles the style text for the <style id="_defaultStyles">
   *   tag injected by VS Code into the webview's frame.
   */
  setEnvStyles(rootStyle: string | null, defaultStyles?: string | null) {
    if (rootStyle === null) {
      document.documentElement.removeAttribute('style');
    } else {
      document.documentElement.setAttribute('style', rootStyle);
    }

    defautlStylesElement.textContent = defaultStyles || '';
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

export interface BoundingBoxWithDepth {
  boundingBox: ViewportBoundingBox;
  depth: number;
}

function toViewportBoundingBoxes(
  pageSpaceRects: Iterable<DOMRect>
): ViewportBoundingBox[] {
  return [...pageSpaceRects] as unknown as ViewportBoundingBox[];
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
