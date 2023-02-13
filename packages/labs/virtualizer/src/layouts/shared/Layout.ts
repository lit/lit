/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export type logicalDimension = 'blockSize' | 'inlineSize';
export type LogicalSize = {
  [key in logicalDimension]: number;
};

export type fixedDimension = 'height' | 'width';
export type FixedSize = {
  [key in fixedDimension]: number;
};

type minOrMax = 'min' | 'max';
export type VirtualizerSizeValue = number | [minOrMax, number];

export type VirtualizerSize = {
  [key in logicalDimension]: VirtualizerSizeValue;
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

export type Margins = {
  [key in margin]: number;
};

export type ItemBox = FixedSize | (FixedSize & Margins);

export type position = 'inlinePosition' | 'top';
export type offset = 'top' | 'right' | 'bottom' | 'left';
export type offsetAxis = 'xOffset' | 'yOffset';

export type scrollPositionDimension = 'top' | 'left';
export type ScrollPosition = {
  [key in scrollPositionDimension]: number;
};

// TODO (graynorton@): This has become a bit of a
// grab-bag. It might make sense to let each layout define
// its own type and provide its own implementation of
// `positionChildren()` that knows how to translate the
// provided fields into the appropriate DOM manipulations.
export type Positions = {
  inlinePosition: number;
  blockPosition: number;
  inlineSize?: number;
  blockSize?: number;
  xOffset?: number;
  yOffset?: number;
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
  scrollError?: ScrollPosition;
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

export type ChildMeasurements = {[key: number]: ItemBox};

export type MeasureChildFunction = <T>(element: Element, item: T) => ItemBox;

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

  viewportScroll: ScrollPosition;

  scrollSize: LogicalSize;

  offsetWithinScroller: ScrollPosition;

  readonly measureChildren?: boolean | MeasureChildFunction;

  readonly listenForChildLoadEvents?: boolean;

  updateItemSizes?: (sizes: ChildMeasurements) => void;

  pin: PinOptions | null;

  unpin: Function;

  getScrollIntoViewCoordinates: (options: PinOptions) => ScrollToCoordinates;

  /**
   * Called by a Virtualizer when an update that
   * potentially affects layout has occurred. For example, a viewport size
   * change.
   *
   * The layout is in turn responsible for dispatching events, as necessary,
   * to the Virtualizer. Each of the following events
   * represents an update that should be determined during a reflow. Dispatch
   * each event at maximum once during a single reflow.
   *
   * Events that should be dispatched:
   * - scrollsizechange
   *     Dispatch when the total length of all items in the scrolling direction,
   *     including spacing, changes.
   *     detail: {
   *       'height' | 'width': number
   *     }
   * - rangechange
   *     Dispatch when the range of children that should be displayed changes.
   *     detail: {
   *       first: number,
   *       last: number,
   *       num: number,
   *       stable: boolean,
   *       remeasure: boolean,
   *       firstVisible: number,
   *       lastVisible: number,
   *     }
   * - itempositionchange
   *     Dispatch when the child positions change, for example due to a range
   *     change.
   *     detail {
   *       [number]: {
   *         left: number,
   *         top: number
   *       }
   *     }
   * - scrollerrorchange
   *     Dispatch when the set viewportScroll offset is not what it should be.
   *     detail {
   *       height: number,
   *       width: number,
   *     }
   */
  reflowIfNeeded: (force?: boolean) => void;
}
