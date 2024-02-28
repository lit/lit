/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as comlink from 'comlink';
import '../protocol/comlink-stream.js';
import {getPositionInLitTemplate} from './queries.js';

// Container for styles copied from the webview
const defaultStylesElement = document.querySelector('#_defaultStyles')!;

// This is the API that's accessible from the webview (our direct parent).
class ApiToWebviewClass {
  boundingBoxesAtPoint(x: number, y: number): BoundingBoxWithDepth[] {
    const result = getMostSpecificNodeInStoryAtPoint(x, y);
    if (result === undefined) {
      return [];
    }
    const {node, depth} = result;
    if (isTextNode(node)) {
      return toViewportBoundingBoxes(rectsForText(node)).map((boundingBox) => {
        return {boundingBox, depth};
      });
    }
    const boundingRects = [node.getBoundingClientRect()];
    return toViewportBoundingBoxes(boundingRects).map((boundingBox) => {
      return {boundingBox, depth};
    });
  }

  getSourceLocationFromPoint(
    x: number,
    y: number
  ): undefined | {path: string; line: number; column: number} {
    const result = getMostSpecificNodeInStoryAtPoint(x, y);
    if (result === undefined) {
      return;
    }
    const node = result.node;
    const position = getPositionInLitTemplate(node);
    const template = position?.template;
    const constructedAt = template?.constructedAt;
    if (constructedAt === undefined) {
      return;
    }
    const callStackLine = constructedAt.split('\n')[2];
    //      at HelloWorld.render (http://localhost:8002/hello-world.js:21:21)
    const match = callStackLine.match(
      /http:\/\/localhost:\d+\/(.+):(\d+):(\d+)/
    );
    if (match === null) {
      console.error(`couldn't match callStackLine: `, callStackLine);
      return;
    }
    const [, path, line, column] = match;
    const templateLocation = {path, line: Number(line), column: Number(column)};
    // Now to get the position _within_ the template, that node occupies.
    console.log(templateLocation);
    console.log(position);
    console.log(template?.el?.content);
    return templateLocation;
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

    defaultStylesElement.textContent = defaultStyles || '';
  }
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function rectsForText(textNode: Text): DOMRectList {
  const range = document.createRange();
  range.selectNode(textNode);
  const rects = range.getClientRects();
  range.detach();
  return rects;
}

function getMostSpecificNodeInStoryAtPoint(
  x: number,
  y: number
): undefined | {node: Element | Text; depth: number} {
  let element = document.elementFromPoint(x, y);
  if (element == null) {
    return;
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
  // We only want to deal with the contents of a story. We want to ignore
  // stuff like the story title, or document.body.
  if (!isElementInStory(element)) {
    return undefined;
  }
  for (const child of element.childNodes) {
    if (!isTextNode(child)) {
      continue;
    }
    // We have to manually check to see if the point is in the text node
    // because elementFromPoint only returns elements.
    for (const rect of rectsForText(child)) {
      if (
        rect.left <= x &&
        x <= rect.right &&
        rect.top <= y &&
        y <= rect.bottom
      ) {
        return {node: child, depth};
      }
    }
  }
  return {node: element, depth};
}

function isElementInStory(element: Element): boolean {
  // Walk up the ancestors, including through shadow roots looking for
  // an ignition-story-container. If we find one, we're in a story.
  let currentElement: Element | null = element;
  while (currentElement !== null) {
    if (currentElement.tagName === 'IGNITION-STORY-CONTAINER') {
      return true;
    }
    if (currentElement.parentNode instanceof ShadowRoot) {
      currentElement = currentElement.parentNode.host;
    } else {
      currentElement = currentElement.parentElement;
    }
  }
  return false;
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
