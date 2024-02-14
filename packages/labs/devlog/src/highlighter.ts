/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// TODO: use the CSS Custom Highlight API when it lands:
//     https://chromestatus.com/feature/5436441440026624
//     though it only supports a few properties, not including
//     outline, so maybe it's not as usable. background-color might be fine
//     though

type Highlightable = Node | Range;

export class Highlighter {
  private readonly highlightedRects: HTMLDivElement[] = [];
  constructor(elems: Iterable<Highlightable>) {
    for (const rect of this.getClientRects(elems)) {
      const highlight = document.createElement('div');
      this.highlightedRects.push(highlight);
      highlight.style.position = 'absolute';
      highlight.style.outline = '3px solid #f008';
      highlight.style.left = `${rect.left}px`;
      highlight.style.top = `${rect.top}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.style.pointerEvents = 'none';
      highlight.style.zIndex = '9999';
      document.body.appendChild(highlight);
    }
  }

  private *getClientRects(nodes: Iterable<Highlightable>) {
    for (const elem of nodes) {
      yield* this.getClientRectsForOne(elem);
    }
  }

  private *getClientRectsForOne(highlightable: Highlightable) {
    if (highlightable instanceof Element || highlightable instanceof Range) {
      yield* highlightable.getClientRects();
    } else if (highlightable instanceof ShadowRoot) {
      yield* highlightable.host.getClientRects();
    } else {
      const range = document.createRange();
      range.selectNode(highlightable);
      yield* range.getClientRects();
    }
  }

  restore() {
    for (const highlight of this.highlightedRects) {
      highlight.remove();
    }
    this.highlightedRects.length = 0;
  }
}
