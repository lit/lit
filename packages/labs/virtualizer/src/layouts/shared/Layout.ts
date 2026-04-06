/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export type logicalSizeDimension = 'blockSize' | 'inlineSize';
export type LogicalSize = {
  blockSize: number;
  inlineSize: number;
};

export type fixedSizeDimension = 'height' | 'width';
export type FixedSize = {
  height: number;
  width: number;
};

type minOrMax = 'min' | 'max';

/**
 * A size value for the virtualizer host element. Either a plain pixel value
 * (used for the block/scroll axis) or a `[minOrMax, pixels]` tuple (used for
 * the inline/cross axis in non-scroller mode). The tuple tells the Virtualizer
 * to set the CSS property as `min(100%, Npx)` or `max(100%, Npx)`, allowing
 * the host to respect its container while also reflecting content size.
 */
export type VirtualizerSizeValue = number | [minOrMax, number];

export type VirtualizerSize = {
  blockSize: VirtualizerSizeValue;
  inlineSize: VirtualizerSizeValue;
};

export type margin =
  | 'marginBlockStart'
  | 'marginBlockEnd'
  | 'marginInlineStart'
  | 'marginInlineEnd';

export type writingMode =
  | 'horizontal-tb'
  | 'vertical-lr'
  | 'vertical-rl'
  | 'unknown';

export type direction = 'ltr' | 'rtl' | 'unknown';

export type virtualizerAxis = 'block' | 'inline';

export type Margins = {
  [key in margin]: number;
};

export type ItemBox = LogicalSize & Margins;
export type ElementLayoutInfo = ItemBox & LayoutParams;

export interface LayoutParams {
  direction: direction;
  writingMode: writingMode;
}

export type FixedCoordinates = {
  top: number;
  left: number;
};

export type LogicalCoordinates = {
  block: number;
  inline: number;
};

// TODO (graynorton@): This has become a bit of a
// grab-bag. It might make sense to let each layout define
// its own type and provide its own implementation of
// `positionChildren()` that knows how to translate the
// provided fields into the appropriate DOM manipulations.
export type Positions = {
  insetInlineStart: number;
  insetBlockStart: number;
  inlineSize?: number;
  blockSize?: number;
};

export interface Range {
  first: number;
  last: number;
}
export interface InternalRange extends Range {
  firstVisible: number;
  lastVisible: number;
}

export interface StateChangedMessage {
  type: 'stateChanged';
  virtualizerSize: VirtualizerSize;
  range: InternalRange;
  childPositions: ChildPositions;
  scrollError?: LogicalCoordinates;
}

export interface VisibilityChangedMessage {
  type: 'visibilityChanged';
  firstVisible: number;
  lastVisible: number;
}

export interface UnpinnedMessage {
  type: 'unpinned';
}

export type LayoutHostMessage =
  | StateChangedMessage
  | UnpinnedMessage
  | VisibilityChangedMessage;

export type LayoutHostSink = (message: LayoutHostMessage) => void;

export type ChildPositions = Map<number, Positions>;

export type ChildLayoutInfo = Map<number, ElementLayoutInfo>;

export interface EditElementLayoutInfoFunctionOptions {
  element: Element;
  item: unknown;
  index: number;
  baselineInfo: ElementLayoutInfo;
}

export type EditElementLayoutInfoFunction = (
  options: EditElementLayoutInfoFunctionOptions
) => ElementLayoutInfo;

export interface PinOptions {
  index: number;
  block?: ScrollLogicalPosition;
}

export type LayoutConstructor = new (
  sink: LayoutHostSink,
  config?: object
) => Layout;

export interface LayoutSpecifier {
  type: LayoutConstructor;
}

export type LayoutSpecifierFactory = (config?: object) => LayoutSpecifier;

export interface BaseLayoutConfig {
  /**
   * @deprecated Set `pin` on the virtualizer (`<lit-virtualizer>`,
   * the `virtualize` directive, or the `Virtualizer` class) instead
   * of in the layout config.
   */
  pin?: PinOptions;
}

export type LayoutConfigValue = LayoutSpecifier | BaseLayoutConfig;

export interface ScrollToCoordinates {
  top?: number;
  left?: number;
}

/**
 * Interface for layouts consumed by Virtualizer.
 */
export interface Layout {
  config?: object;

  items: unknown[];

  writingMode: writingMode;

  direction: direction;

  viewportSize: LogicalSize;

  viewportScroll: LogicalCoordinates;

  scrollSize: LogicalSize;

  offsetWithinScroller: LogicalCoordinates;

  readonly editElementLayoutInfo?: EditElementLayoutInfoFunction;

  readonly listenForChildLoadEvents?: boolean;

  updateItemSizes?: (sizes: ChildLayoutInfo) => void;

  pin: PinOptions | null;

  unpin: Function;

  getScrollIntoViewCoordinates: (options: PinOptions) => ScrollToCoordinates;

  /**
   * Called by the Virtualizer when an update that potentially affects
   * layout has occurred (for example, a viewport size change).
   *
   * The layout recomputes what it needs to, then pushes any changes
   * back to the Virtualizer via the `LayoutHostSink` it was constructed
   * with. Supported messages are defined in `LayoutHostMessage`:
   *
   * - `StateChangedMessage` — emitted when the virtualizer size,
   *   visible range, child positions, or scroll error change. Carries
   *   logical coordinates (`blockSize`/`inlineSize` and `block`/`inline`).
   * - `VisibilityChangedMessage` — emitted when the first/last visible
   *   item indices change.
   * - `UnpinnedMessage` — emitted when a pin is released.
   *
   * If `force` is true, the layout must recompute unconditionally;
   * otherwise it may skip work when nothing has changed.
   */
  reflowIfNeeded: (force?: boolean) => void;

  /**
   * Called by the Virtualizer when a large scroll jump is detected.
   * The layout should stop processing updates until unfreeze() is called.
   */
  freeze: () => void;

  /**
   * Called by the Virtualizer when a large scroll jump has settled.
   * The layout should clean up stale internal state and prepare for
   * a fresh layout cycle from the current scroll position.
   */
  unfreeze: () => void;
}
