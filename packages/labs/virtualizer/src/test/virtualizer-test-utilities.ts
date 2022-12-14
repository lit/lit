/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {expect, html, fixture} from '@open-wc/testing';
import {isInViewport, until, last, first} from './helpers.js';
import {Virtualizer} from '../Virtualizer.js';
import {ScrollerShim} from '../ScrollerController.js';
import {LayoutSpecifier, BaseLayoutConfig} from '../layouts/shared/Layout.js';
import {LitVirtualizer} from '../LitVirtualizer.js';
import '../lit-virtualizer.js';
import {
  virtualize,
  virtualizerRef,
  VirtualizerHostElement,
} from '../virtualize.js';
import {KeyFn} from '../../../../lit/directives/repeat.js';
import {TemplateResult} from '../../../../lit/index.js';

/**
 *
 */

interface Coordinates {
  top: number;
  left: number;
}

interface ScrollObserverResults {
  events: Event[];
  startPos: Coordinates;
  endPos: Coordinates;
  distance: Coordinates;
  duration: number | null;
}

class Scroller extends ScrollerShim {
  constructor(target: Element | Window) {
    super(target === window ? undefined : (target as Element));
  }
}

export function observeScroll(
  target: Element | Window,
  trigger: () => void,
  wait = 100
): Promise<ScrollObserverResults> {
  const scroller = new Scroller(target);
  const events: Event[] = [];
  let report: () => void = () => {};
  let timeout: number | null = null;
  const startPos = {top: scroller.scrollTop, left: scroller.scrollLeft};
  const recordEvent = (e: Event) => {
    events.push(e);
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(report, wait) as unknown as number;
  };
  target.addEventListener('scroll', recordEvent);
  const promise = new Promise<ScrollObserverResults>((resolve) => {
    report = () => {
      target.removeEventListener('scroll', recordEvent);
      target.removeEventListener('scroll', report);
      const endPos = {top: scroller.scrollTop, left: scroller.scrollLeft};
      const duration =
        events.length === 0
          ? null
          : events.length === 1
          ? 0
          : last(events).timeStamp - first(events).timeStamp;
      const distance = {
        top: endPos.top - startPos.top,
        left: endPos.left - startPos.left,
      };
      resolve({
        startPos,
        endPos,
        events,
        duration,
        distance,
      });
    };
  });
  timeout = setTimeout(report, wait) as unknown as number;
  trigger();
  return promise;
}

class VirtualizerInspector {
  host: VirtualizerHostElement;
  range?: {first: number; last: number};
  visible?: {first: number; last: number};
  constructor(host: VirtualizerHostElement) {
    this.host = host;
    host.addEventListener('rangeChanged', ({first, last}) => {
      this.range = {first, last};
    });
    host.addEventListener('visibilityChanged', ({first, last}) => {
      this.visible = {first, last};
    });
  }
  get visibleChildElements() {
    return this.childElements.filter((el) =>
      isInViewport(el, this.host)
    ) as HTMLElement[];
  }
  get childElements() {
    return Array.from(this.host.querySelectorAll(':not([virtualizer-sizer])'));
  }
}

type emptyString = '';
type ItemGenFn<T = unknown> = (item: emptyString, idx: number) => T;
type RenderItem<T = unknown> = (item: T, idx: number) => TemplateResult;
type VirtualizerFixtureLayoutOptions = LayoutSpecifier | BaseLayoutConfig;
interface RenderVirtualizerOptions<T = unknown> {
  items: T[];
  renderItem: RenderItem<T>;
  scroller?: boolean;
  keyFunction?: KeyFn<T>;
  layout?: VirtualizerFixtureLayoutOptions;
}
type RenderVirtualizer<T = unknown> = (
  options: RenderVirtualizerOptions<T>
) => TemplateResult;
export interface DefaultItem {
  index: number;
  text: string;
}

const defaultItemGenFn: ItemGenFn<DefaultItem> = (
  _s: emptyString,
  index: number
) => ({index, text: `Item ${index}`} as DefaultItem);

// Explicitly sizing the container element (<section>) to
// enable easy testing of horizontal scrolling in the default
// fixture configuration. Probably want to change the behavior
// of virtualizer to (optionally) auto-size on the cross-axis,
// which would make this unnecessary.
const defaultFixtureStyles = html`
  <style>
    section {
      height: 400px;
      width: 400px;
    }

    lit-virtualizer[scroller],
    .virtualizerHost[scroller] {
      height: 400px;
      width: 400px;
    }
  </style>
`;

const defaultItemStyles = html`
  <style>
    .item {
      height: 50px;
      width: 50px;
    }
  </style>
`;

const defaultRenderItem = ((item: DefaultItem) => html`
  <div id=${item.index} class="item">${item.text}</div>
`) as RenderItem<DefaultItem>;

const defaultRenderVirtualizeDirective: RenderVirtualizer<DefaultItem> = ({
  items,
  renderItem,
  scroller,
  keyFunction,
  layout,
}) => html`
  <div class="virtualizerHost" ?scroller=${scroller}>
    ${virtualize({
      scroller,
      items,
      renderItem,
      keyFunction,
      layout,
    })}
  </div>
`;

const defaultRenderLitVirtualizer: RenderVirtualizer<DefaultItem> = ({
  items,
  renderItem,
  scroller,
  keyFunction,
  layout,
}) => {
  return keyFunction
    ? layout
      ? html`
          <lit-virtualizer
            ?scroller=${scroller}
            .items=${items}
            .renderItem=${renderItem as RenderItem<unknown>}
            .keyFunction=${keyFunction as KeyFn<unknown>}
            .layout=${layout}
          ></lit-virtualizer>
        `
      : html`
          <lit-virtualizer
            ?scroller=${scroller}
            .items=${items}
            .renderItem=${renderItem as RenderItem<unknown>}
            .keyFunction=${keyFunction as KeyFn<unknown>}
          ></lit-virtualizer>
        `
    : layout
    ? html`
        <lit-virtualizer
          ?scroller=${scroller}
          .items=${items}
          .renderItem=${renderItem}
          .layout=${layout}
        ></lit-virtualizer>
      `
    : html`
        <lit-virtualizer
          ?scroller=${scroller}
          .items=${items}
          .renderItem=${renderItem}
        ></lit-virtualizer>
      `;
};

export interface VirtualizerFixtureOptions<T = unknown> {
  nItems?: number;
  itemGenFn?: ItemGenFn<T>;
  items?: T[];
  fixtureStyles?: TemplateResult;
  itemStyles?: TemplateResult;
  renderItem?: RenderItem<T>;
  renderLitVirtualizerTag?: RenderVirtualizer<T>;
  renderVirtualizeDirective?: RenderVirtualizer<T>;
  keyFunction?: KeyFn<T>;
  useDirective?: boolean;
  scroller?: boolean;
  scrollerSelector?: string;
  layout?: VirtualizerFixtureLayoutOptions;
}

export async function virtualizerFixture<T = unknown>(
  options: VirtualizerFixtureOptions<T> = {}
) {
  const nItems = options.nItems || 1000;
  const itemGenFn =
    options.itemGenFn ||
    (defaultItemGenFn as ItemGenFn<unknown> as ItemGenFn<T>);
  const items: T[] = options.items || new Array(nItems).fill('').map(itemGenFn);
  const fixtureStyles = options.fixtureStyles || defaultFixtureStyles;
  const itemStyles = options.itemStyles || defaultItemStyles;
  const renderItem =
    options.renderItem ||
    (defaultRenderItem as RenderItem<unknown> as RenderItem<T>);
  const scroller = options.scroller === undefined ? true : options.scroller;
  const renderVirtualizer =
    options.renderLitVirtualizerTag ||
    options.renderVirtualizeDirective ||
    options.useDirective
      ? (defaultRenderVirtualizeDirective as RenderVirtualizer<unknown> as RenderVirtualizer<T>)
      : (defaultRenderLitVirtualizer as RenderVirtualizer<unknown> as RenderVirtualizer<T>);
  const keyFunction = options.keyFunction;
  const layout = options.layout;
  const virtualizerMarkup = renderVirtualizer({
    items,
    renderItem,
    scroller,
    keyFunction,
    layout,
  });
  const container = await fixture(html`
    <section>${fixtureStyles} ${itemStyles} ${virtualizerMarkup}</section>
  `);
  let virtualizer: Virtualizer | LitVirtualizer<T>;
  let controller: Virtualizer;
  let host: HTMLElement;
  expect(container.tagName).to.equal('SECTION');
  if (options.renderVirtualizeDirective || options.useDirective) {
    host = (await until(() =>
      container.querySelector('.virtualizerHost')
    )) as HTMLElement;
    expect(host).to.be.instanceOf(HTMLElement);
    virtualizer = await until(
      () => (host as VirtualizerHostElement)[virtualizerRef]!
    );
    expect(virtualizer).to.be.instanceOf(Virtualizer);
    controller = virtualizer;
  } else {
    virtualizer = (await until(() =>
      container.querySelector('lit-virtualizer')
    )) as LitVirtualizer<unknown> as LitVirtualizer<T>;
    expect(virtualizer).to.be.instanceOf(LitVirtualizer);
    host = virtualizer;
    controller = await until(
      () => (virtualizer as VirtualizerHostElement)[virtualizerRef]!
    );
    expect(controller).to.be.instanceOf(Virtualizer);
  }
  const scrollerNode = scroller
    ? host
    : options.scrollerSelector
    ? container.querySelector(options.scrollerSelector)!
    : window;
  expect(scrollerNode).not.to.equal(null);
  expect(scrollerNode.scrollTo).not.to.equal(undefined);
  const scrollerController = new Scroller(scrollerNode);
  const inspector = new VirtualizerInspector(host);
  await virtualizer.layoutComplete;
  return {
    container,
    host,
    virtualizer,
    controller,
    inspector,
    scroller: scrollerNode,
    scrollerController,
  };
}
