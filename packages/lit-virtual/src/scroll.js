import { directive } from 'lit-html';
import { VirtualScroller } from 'uni-virtual/src/VirtualScroller.js';

import { LitMixin } from './repeat.js';

export const LitScroller = LitMixin(VirtualScroller);

const partToScroller = new WeakMap();
export const scroll = directive((config = {}) => async part => {
  let scroller = partToScroller.get(part);
  if (!scroller) {
    if (!part.startNode.isConnected) {
      await Promise.resolve();
    }
    // if (!config.layout /*&& config.direction*/) {
    //   const { Layout1d } = await import('uni-virtual');
    //   config.layout = new Layout1d();
    // }
    let {template, layout, scrollTarget} = config;
    scroller = new LitScroller({part, template, layout, scrollTarget});
    partToScroller.set(part, scroller);
  }
  Object.assign(scroller, {
    items: config.items,
    totalItems: config.totalItems === undefined ? null : config.totalItems
  });
  // scroller.totalItems = config.totalItems;
});

// export const virtualScroller = (totalItems, template, direction = 'vertical') =>
//     scroller({totalItems, template, direction});
