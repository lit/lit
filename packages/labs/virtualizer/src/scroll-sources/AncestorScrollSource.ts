/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {fixedInsetLabel} from './_types.js';
import {BaseDomScrollSource} from './BaseDomScrollSource.js';

/**
 * `ScrollSource` implementation for the default mode where the window
 * or a clipping ancestor is the scroll container.
 *
 * Owns the `ScrollerController`, scroll listeners on window and all
 * clipping ancestors, a `ResizeObserver` watching host/ancestors/scroller,
 * and the window resize listener (all inherited from `BaseDomScrollSource`).
 */
export class AncestorScrollSource extends BaseDomScrollSource {
  readonly isSelfScroller = false;

  protected _includeSelfInClippingAncestors(): boolean {
    return false;
  }

  /**
   * Ancestor mode: compute the offset from the host element's position
   * relative to the scrolling element. When the scroller is not the
   * document scroller (i.e., it's an actual element with its own
   * scroll position), add the scroller's current scroll position so
   * that the offset reflects the host's position in the scroller's
   * content coordinate space rather than its viewport coordinates.
   */
  protected _computeOffsetWithinScroller(args: {
    hostElementBounds: DOMRect;
    scrollingElement: Element;
    scrollingElementBounds: DOMRect;
    blockStartLabel: fixedInsetLabel;
    inlineStartLabel: fixedInsetLabel;
    blockScrollPosition: (el: Element) => number;
    inlineScrollPosition: (el: Element) => number;
  }): {block: number; inline: number} {
    const {
      hostElementBounds,
      scrollingElement,
      scrollingElementBounds,
      blockStartLabel,
      inlineStartLabel,
      blockScrollPosition,
      inlineScrollPosition,
    } = args;
    let offsetBlock =
      hostElementBounds[blockStartLabel] -
      scrollingElementBounds[blockStartLabel];
    let offsetInline =
      hostElementBounds[inlineStartLabel] -
      scrollingElementBounds[inlineStartLabel];
    if (!this._scrollerController!.isDocumentScroller) {
      offsetBlock += blockScrollPosition(scrollingElement);
      offsetInline += inlineScrollPosition(scrollingElement);
    }
    return {block: offsetBlock, inline: offsetInline};
  }
}
