/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {BaseDomScrollSource} from './BaseDomScrollSource.js';
import {ScrollSourceHost} from './ScrollSource.js';

/**
 * Callback used to emit warnings (e.g. zero-size). Constructed by
 * `Virtualizer` and passed in so the source can warn without holding a
 * reference to the full `InstanceWarnings` instance.
 */
export type EmitWarning = (
  key: string,
  condition: boolean,
  message: string
) => void;

/**
 * `ScrollSource` implementation for `scroller: true` mode, where the
 * host element itself is the scroll container. Inherits all the DOM
 * observation, ScrollerController lifecycle, viewport math, and
 * smooth-scroll orchestration from `BaseDomScrollSource`; differs from
 * `AncestorScrollSource` only in that:
 *
 *   - The host is included as a clipping ancestor (the host itself is
 *     the scroller).
 *   - `offsetWithinScroller` is `{block: 0, inline: 0}`, since the
 *     host's content coordinates ARE the scroller's content coordinates.
 *   - The source emits a "zero-size" warning when the host is missing
 *     a CSS dimension, since self-scroller mode requires explicit
 *     sizing via CSS.
 */
export class SelfScrollSource extends BaseDomScrollSource {
  readonly isSelfScroller = true;

  private _emitWarning: EmitWarning;

  constructor(host: ScrollSourceHost, emitWarning: EmitWarning) {
    super(host);
    this._emitWarning = emitWarning;
  }

  protected _includeSelfInClippingAncestors(): boolean {
    return true;
  }

  protected _computeOffsetWithinScroller(): {block: number; inline: number} {
    // Self-scroller: host's content coordinates ARE the scroller's
    // content coordinates, so there's no offset between them.
    return {block: 0, inline: 0};
  }

  protected _emitWarnings(args: {
    hostElementBounds: DOMRect;
    isHidden: boolean;
  }): void {
    const {hostElementBounds, isHidden} = args;
    const hasZeroSize =
      !isHidden &&
      (hostElementBounds.width === 0 || hostElementBounds.height === 0);
    this._emitWarning(
      'zero-size',
      hasZeroSize,
      '[lit-virtualizer] The virtualizer host element has a zero-size ' +
        'dimension (width: ' +
        hostElementBounds.width +
        ', height: ' +
        hostElementBounds.height +
        '). ' +
        'A scroller-mode virtualizer needs explicit sizing via CSS. ' +
        'For example: `lit-virtualizer { block-size: 400px; }`'
    );
  }
}
