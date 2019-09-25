import { directive, NodePart, TemplateResult } from 'lit-html';
import { VirtualScroller } from './uni-virtualizer/lib/VirtualScroller.js';
import { Layout } from './uni-virtualizer/lib/layouts/Layout.js';
import { LitMixin } from './repeat.js';

export class LitScroller<Item> extends LitMixin(VirtualScroller)<Item> {}

const partToScroller: WeakMap<NodePart, LitScroller<unknown>> = new WeakMap();

/**
 * Configuration options for the scroll directive.
 */
interface ScrollConfig<Item> {
  /**
   * A function that returns a lit-html TemplateResult. It will be used
   * to generate the DOM for each item in the virtual list.
   */
  renderItem?: (item: Item, index?: number) => TemplateResult;

  layout?: Layout;

  /**
   * An element that receives scroll events for the virtual scroller.
   */
  scrollTarget?: Element | Window;

  /**
   * Whether to build the virtual scroller within a shadow DOM.
   */
  useShadowDOM?: boolean;

  /**
   * The list of items to display via the renderItem function.
   */
  items?: Array<Item>;

  /**
   * Limit for the number of items to display. Defaults to the length of the
   * items array.
   */
  totalItems?: number;

  /**
   * Index and position of the item to scroll to.
   */
  scrollToIndex?: {index: number, position?: string};
}

/**
 * A lit-html directive that turns its parent node into a virtual scroller.
 *
 * See ScrollConfig interface for configuration options.
 */
export const scroll: <T>(config: ScrollConfig<T>) => (part: NodePart) => Promise<void> = directive(<T>(config: ScrollConfig<T>) => async (part: NodePart) => {
  // Retain the scroller so that re-rendering the directive's parent won't
  // create another one.
  let scroller = partToScroller.get(part);
  if (!scroller) {
    if (!part.startNode.isConnected) {
      await Promise.resolve();
    }
    const {renderItem, layout, scrollTarget, useShadowDOM} = config;
    scroller = new LitScroller<T>({part, renderItem, layout, scrollTarget, useShadowDOM});
    partToScroller.set(part, scroller);
  }
  Object.assign(scroller, {
    items: config.items,
    totalItems: config.totalItems === undefined ? null : config.totalItems,
    scrollToIndex: config.scrollToIndex === undefined ? null : config.scrollToIndex,
  });
});
