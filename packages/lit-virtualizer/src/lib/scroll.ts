import { directive, NodePart, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { Type, Layout, LayoutConfig } from './uni-virtualizer/lib/layouts/Layout.js';
import { VirtualScroller, RangeChangeEvent } from './uni-virtualizer/lib/VirtualScroller.js';


interface ScrollDirectiveState {
    scroller: VirtualScroller<unknown, HTMLElement>,
    first: number,
    last: number,
    renderItem: (item: any, index?: number) => TemplateResult,
    keyFunction: (item: any) => any,
    items: Array<any>
}

const partToState: WeakMap<NodePart, ScrollDirectiveState> = new WeakMap();

/**
 * Configuration options for the scroll directive.
 */
interface ScrollConfig<Item> {
    /**
     * A function that returns a lit-html TemplateResult. It will be used
     * to generate the DOM for each item in the virtual list.
     */
    renderItem?: (item: Item, index?: number) => TemplateResult;

    keyFunction?: (item:any) => any;
  
    // TODO (graynorton): Document...
    layout?: Layout | Type<Layout> | LayoutConfig;
  
    /**
     * An element that receives scroll events for the virtual scroller.
     */
    scrollTarget?: Element | Window;
  
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
  
function renderItems({renderItem, keyFunction, first, last, items}) {
    if (!keyFunction) {
        keyFunction = item => item;
    }
    const itemsToRender = [];
    if (first >= 0 && last >= first) {
        for (let i = first; i < last + 1; i++) {
            itemsToRender.push(items[i]);
        }    
    }
    return repeat(itemsToRender, keyFunction, renderItem);
}

/**
 * A lit-html directive that turns its parent node into a virtual scroller.
 *
 * See ScrollConfig interface for configuration options.
 */
export const scroll: <Item>(config: ScrollConfig<Item>) => (part: NodePart) => Promise<void> = directive(<Item, Child extends HTMLElement>(config: ScrollConfig<Item>) => async (part: NodePart) => {
    // Retain the scroller so that re-rendering the directive's parent won't
    // create another one.
    const { items, renderItem, keyFunction } = config;
    let state = partToState.get(part);
    if (!state) {
      if (!part.startNode.isConnected) {
        await Promise.resolve();
      }
        const container = part.startNode.parentNode as HTMLElement;
        const scrollTarget = config.scrollTarget || container;
        state = {
            scroller: new VirtualScroller<Item, Child>({ container, scrollTarget }),
            first: 0,
            last: -1,
            renderItem,
            keyFunction,
            items
        };
        partToState.set(part, state);
        container.addEventListener('rangeChanged', (e: CustomEvent<RangeChangeEvent>) => {
            state.first = e.detail.first;
            state.last = e.detail.last;
            part.setValue(renderItems(state));
            part.commit();
        });
    }
    const { scroller } = state;
    Object.assign(state, { items, renderItem, keyFunction });
    if (config.items !== undefined) {
        scroller.items = items;
        scroller.totalItems = config.items.length;
    }
    for (let prop of ['totalItems', 'layout', 'scrollToIndex']) {
        if (config[prop] !== undefined) {
            scroller[prop] = config[prop];
        }
    }
    part.setValue(renderItems(state));
  });
  