export type dimension = 'height' | 'width'
export type Size = {
  [key in dimension]: number
}

export type Margins = {
  marginTop: number,
  marginRight: number,
  marginBottom: number,
  marginLeft: number
}

export type ItemBox = Size & Margins

export type position = 'left' | 'top'
export type Positions = {
  [key in position]: number
}

export type ScrollDirection = 'vertical' | 'horizontal'

/**
 * Interface for layouts consumed by VirtualScroller or VirtualRepeater.
 */
export interface Layout {
  totalItems: number;

  direction: ScrollDirection;

  viewportSize: Size;

  viewportScroll: Positions;
  
  updateItemSizes: (sizes: {
    [key: number]: ItemBox
  }) => void;

  addEventListener;

  removeEventListener;

  scrollToIndex: (index: number, position: string) => void;

  /**
   * Called by a VirtualRepeater or VirtualScroller when an update that
   * potentially affects layout has occurred. For example, a viewport size
   * change.
   * 
   * The layout is in turn responsible for dispatching events, as necessary,
   * to the VirtualRepeater or VirtualScroller. Each of the following events
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
   *     Dispatch when the range of children that should be displayed changes,
   *     based on layout calculations and the size of the container.
   *     detail: {
   *       first: number,
   *       last: number,
   *       num: number,
   *       stable: boolean,
   *       remeasure: boolean
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
  reflowIfNeeded: () => void;
}