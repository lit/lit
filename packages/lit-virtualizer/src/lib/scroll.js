import { directive } from 'lit-html';
import { VirtualScroller } from './uni-virtualizer/lib/VirtualScroller.js';

import { LitMixin } from './repeat.js';

export const LitScroller = LitMixin(VirtualScroller);

const partToScroller = new WeakMap();
export const scroll = directive((config = {}) => async part => {
  let scroller = partToScroller.get(part);
  if (!scroller) {
    if (!part.startNode.isConnected) {
      await Promise.resolve();
    }
    let {template, layout, scrollTarget, useShadowDOM} = config;
    scroller = new LitScroller({part, template, layout, scrollTarget, useShadowDOM});
    partToScroller.set(part, scroller);
  }
  Object.assign(scroller, {
    items: config.items,
    totalItems: config.totalItems === undefined ? null : config.totalItems
  });
});