/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as comlink from 'comlink';
import '../protocol/comlink-stream.js';
import {findAllTemplateInstances, getPositionInLitTemplate} from './queries.js';
import type {TemplatePiece} from '../protocol/common.js';
import {ChildPart, TemplateInstance} from 'lit-html';
import {getSourceMap} from '../util/source-map.js';

// Container for styles copied from the webview
const defaultStylesElement = document.querySelector('#_defaultStyles')!;

// This is the API that's accessible from the webview (our direct parent).
class ApiToWebview {
  getElementAtPoint(x: number, y: number): ElementInfo | undefined {
    const result = getMostSpecificNodeInStoryAtPoint(x, y);
    if (result === undefined) {
      return;
    }
    const el = isTextNode(result.node)
      ? result.node.parentElement
      : result.node;
    if (el === null) {
      // Must have clicked on a text child of the shadow root.
      return;
    }
    const sourceId = el.getAttribute('__ignition-source-id__');
    if (sourceId === null) {
      // Must be a dynamic element not cloned from a template. Can't select.
      return;
    }
    const bounds = el.getBoundingClientRect();
    const computedStyle = getComputedStyle(el);
    const display = computedStyle.display;
    const location = this.#getSourceLocationFromNode(el);
    return {
      kind: 'element',
      sourceId,
      bounds,
      display,
      location,
    };
  }

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

  getSourceLocationFromPoint(x: number, y: number): SourceLocation | undefined {
    const result = getMostSpecificNodeInStoryAtPoint(x, y);
    if (result === undefined) {
      return;
    }
    const node = result.node;
    return this.#getSourceLocationFromNode(node);
  }

  #getSourceLocationFromNode(node: Element | Text): SourceLocation | undefined {
    const position = getPositionInLitTemplate(node);
    const templateLocation = parseConstructedAt(
      position?.template.constructedAt
    );
    if (templateLocation == null) {
      return;
    }
    // Now to get the position _within_ the template, that node occupies.
    // console.log(templateLocation);
    // console.log(position);
    // console.log(template?.el?.content);
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

  reload() {
    window.location.reload();
  }

  async highlightTemplatePiece(
    templatePiece: TemplatePiece
  ): Promise<ViewportBoundingBox[]> {
    const boundingBoxes: ViewportBoundingBox[] = [];
    switch (templatePiece.kind) {
      case 'element': {
        for (const {template, part} of findAllTemplateInstances()) {
          const templateLocation = parseConstructedAt(
            template._$template.constructedAt
          );
          if (templateLocation === undefined) {
            continue;
          }
          const sourceMap = await getSourceMap(templateLocation.url);
          if (sourceMap === undefined) {
            continue;
          }
          const fileMatches = sourceMap.sources.some(
            (source) =>
              new URL(source, templateLocation.url).href === templatePiece.url
          );
          if (!fileMatches) {
            continue;
          }
          for (const node of walkNodesRenderedByTemplateInstance(
            template,
            part
          )) {
            if (!(node instanceof Element)) {
              continue;
            }
            if (
              node.getAttribute('__ignition-source-id__') ===
              templatePiece.sourceId
            ) {
              const bcr = node.getBoundingClientRect();
              boundingBoxes.push(
                ...toViewportBoundingBoxes([
                  {x: bcr.x, y: bcr.y, width: bcr.width, height: bcr.height},
                ])
              );
            }
          }
        }
      }
    }
    return boundingBoxes;
  }
}

function parseConstructedAt(
  constructedAt: string | undefined
): SourceLocation | undefined {
  if (constructedAt === undefined) {
    return;
  }
  const callStackLine = constructedAt.split('\n')[2];
  //      at HelloWorld.render (http://localhost:8002/hello-world.js:21:21)
  const match = callStackLine.match(/(http:\/\/localhost:\d+\/.+):(\d+):(\d+)/);
  if (match === null) {
    console.error(`couldn't match callStackLine: `, callStackLine);
    return;
  }
  const [, url, line, column] = match;
  return {url, line: Number(line), column: Number(column)};
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

export type {ApiToWebview};

export type ElementInfo =
  | {
      kind: 'element';
      sourceId: string;
      bounds: DOMRect;
      location: SourceLocation | undefined;
      display: string;
    }
  | {kind: 'text'; bounds: DOMRect; location: SourceLocation | undefined};

export interface SourceLocation {
  url: string;
  line: number;
  column: number;
}

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
  pageSpaceRects: Iterable<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>
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
  const api = new ApiToWebview();
  const endpoint = await getPortToWebview();
  comlink.expose(api, endpoint);
}

function* walkNodesRenderedByTemplateInstance(
  template: TemplateInstance,
  part: ChildPart
) {
  let currentNode: Node | null;
  if (part.startNode != null) {
    currentNode = nextNodeInOrderOutwards(part.startNode);
  } else {
    currentNode = template.parentNode.childNodes[0];
  }
  let endNode: Node;
  if (part.endNode != null) {
    endNode = part.endNode;
  } else {
    endNode = template.parentNode;
  }
  let partIndex = 0;
  function getNextChildPart() {
    if (partIndex >= template._$parts.length) {
      return;
    }
    const nextPart = template._$parts[partIndex];
    partIndex++;
    if (nextPart?.type === 2) {
      return nextPart;
    }
    return getNextChildPart();
  }
  let nextChildPart = getNextChildPart();
  while (currentNode !== endNode && currentNode != null) {
    if (currentNode == null) {
      throw new Error('internal error: currentNode is nullish');
    }
    if (nextChildPart?.startNode === currentNode) {
      // skip over the part
      currentNode =
        nextChildPart.endNode ??
        nextNodeInOrderOutwards(
          nextChildPart.endNode ?? nextChildPart.parentNode
        );
      nextChildPart = getNextChildPart();
      continue;
    }
    yield currentNode;
    if (
      nextChildPart != null &&
      nextChildPart.startNode == null &&
      nextChildPart.parentNode === currentNode
    ) {
      // this node is controlled by the current part, so don't descend into it.
      currentNode = nextNodeInOrderOutwards(currentNode);
      nextChildPart = getNextChildPart();
      continue;
    }
    currentNode = nextNodeInOrderInwards(currentNode);
  }
}

function nextNodeInOrderOutwards(node: Node | null): Node | null {
  if (node == null) {
    return null;
  }
  return node.nextSibling ?? nextNodeInOrderOutwards(node.parentNode);
}

function nextNodeInOrderInwards(node: Node | null): Node | null {
  if (node == null) {
    return null;
  }
  return node.firstChild ?? nextNodeInOrderOutwards(node);
}
