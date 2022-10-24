/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {repeat} from 'lit-html/directives/repeat.js';
import {render, html} from 'lit-html';
import {queryParams} from '../../utils/query-params.js';

const defaults = {
  // Which repeat method to use ('repeat' or 'map')
  method: (queryParams.method ?? 'repeat') as keyof typeof methods,
  // Item template to use ('li' or 'input')
  itemType: (queryParams.itemType ?? 'li') as keyof typeof itemTemplates,
  // Delay (when itemType=ce)
  delay: (queryParams.delay ?? 0) as number,
  // Initial count of items to create
  initialCount: 1000,
  // Replace items with newly created items (also specify 'from' and 'to')
  replaceCount: 0,
  // Remove items (also specify 'from')
  removeCount: 0,
  // Move items (also specify 'from' and 'to')
  moveCount: 0,
  // Add items (also specify 'to')
  addCount: 0,
  // Add items equally spaced through list
  addStripeCount: 0,
  // Remove items equally spaced through list
  removeStripeCount: 0,
  // Replace items with newly created items equally spaced through list
  replaceStripeCount: 0,
  // Swap items (also specify 'from' and 'to)
  swapCount: 0,
  // Reverse the order of items (also specify 'from' and 'to)
  reverseCount: 0,
  // Shuffle items (also specify 'from' and 'to)
  shuffleCount: 0,
  // 'from' item index used in operations (remove, move, swap)
  from: 0,
  // 'to' item index used in operations (add, move, swap)
  to: 1000,
  // When true, supported operations are mirrored symmetrically on the other side
  // of the list
  mirror: false,
  // Number of times to loop, repeating the same operation on the list
  loopCount: 10,
};

const preset: {[index: string]: Partial<typeof defaults>} = {
  render: {initialCount: 1000},
  nop: {},
  add: {addCount: 10, to: 100, loopCount: 50},
  remove: {removeCount: 10, from: 100, loopCount: 50},
  addEdges: {addCount: 100, to: 0, mirror: true, loopCount: 10},
  removeEdges: {removeCount: 100, from: 0, mirror: true, loopCount: 10},
  addMirror: {addCount: 100, to: 100, mirror: true, loopCount: 10},
  removeMirror: {removeCount: 100, from: 100, mirror: true, loopCount: 10},
  addStripe: {addStripeCount: 50, loopCount: 10},
  removeStripe: {removeStripeCount: 50, loopCount: 10},
  swapOne: {swapCount: 1, from: 100, to: 800, loopCount: 100},
  swapMany: {swapCount: 100, from: 100, to: 800, loopCount: 4},
  swapEdges: {swapCount: 1, from: 0, to: 999, loopCount: 100},
  moveForwardOne: {moveCount: 1, from: 100, to: 800, loopCount: 100},
  moveForwardMany: {moveCount: 100, from: 100, to: 800, loopCount: 4},
  moveBackwardOne: {moveCount: 1, from: 800, to: 100, loopCount: 100},
  moveBackwardMany: {moveCount: 100, from: 800, to: 100, loopCount: 4},
  reverse: {reverseCount: 1000, loopCount: 4},
  shuffle: {shuffleCount: 1000, loopCount: 5},
  replace: {replaceCount: 1000, loopCount: 2},
  replaceStripe: {replaceStripeCount: 100, loopCount: 10},
  removeAll: {removeCount: 1000, from: 0, loopCount: 1},
};

// `method` and `itemType` are special and override defaults
const customParams = ['method', 'itemType', 'delay'].reduce(
  (n, k) => (k in queryParams ? n - 1 : n),
  Object.keys(queryParams).length
);

// If query params are provided, put that operation in a `custom` step
const routine =
  customParams === 0
    ? preset
    : {
        render: {...queryParams},
        custom: {...queryParams},
      };

let gid = 0;
const container = document.getElementById('container')!;
type Item = {
  id: number;
  text: string;
};
const createItem = () => ({id: gid, text: `item ${gid++}`});
const createItems = (count: number): Item[] =>
  new Array(count).fill(0).map(createItem);

const itemTemplates = {
  li: (item: Item) => html`<li>${item.text}</li>`,
  input: (item: Item) =>
    html`<div>${item.text}: <input value="${item.text}" /></div>`,
  ce: (item: Item) => html`<c-e .text=${item.text}></c-e>`,
};

if (defaults.itemType === 'ce') {
  customElements.define(
    'c-e',
    class extends HTMLElement {
      set text(s: string) {
        this.textContent = s;
        if (defaults.delay > 0) {
          const end = performance.now() + defaults.delay;
          while (performance.now() < end) {
            /* spin loop */
          }
        }
      }
      get item() {
        return this.textContent;
      }
    }
  );
}

const methods = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repeat(items: Item[], renderItem: (item: Item) => any) {
    return html`<ul>
      ${repeat(items, (item) => item.id, renderItem)}
    </ul>`;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map(items: Item[], renderItem: (item: Item) => any) {
    return html`<ul>
      ${items.map(renderItem)}
    </ul>`;
  },
};

let items: Item[] = [];

for (const [step, values] of Object.entries(routine)) {
  const s = {...defaults, ...values};
  const renderTemplate = methods[s.method];
  const renderItem = itemTemplates[s.itemType];

  if (step === 'render') {
    items = createItems(s.initialCount);
    performance.mark('render-start');
    render(renderTemplate(items, renderItem), container);
    performance.measure('render', 'render-start');
    performance.mark('update-start');
  } else {
    // TODO(kschaaf): Accumulate measurements around just the render
    // once/if https://github.com/Polymer/tachometer/issues/196 is resolved
    performance.mark(`${step}-start`);

    for (let i = 0; i < s.loopCount; i++) {
      if (s.replaceCount) {
        items = [
          ...items.slice(0, s.from),
          ...createItems(s.replaceCount),
          ...items.slice(s.to),
        ];
      }

      if (s.removeCount) {
        items = items.filter(
          (_, i) => i < s.from || i >= s.from + s.removeCount
        );
        if (s.mirror) {
          items = items.filter(
            (_, i) =>
              i < items.length - s.from - s.removeCount ||
              i >= items.length - s.from
          );
        }
      }

      if (s.addCount) {
        items = [
          ...items.slice(0, s.to),
          ...createItems(s.addCount),
          ...items.slice(s.to),
        ];
        if (s.mirror) {
          items = [
            ...items.slice(0, items.length - s.to),
            ...createItems(s.addCount),
            ...items.slice(items.length - s.to),
          ];
        }
      }

      if (s.addStripeCount) {
        const step = (items.length + s.addStripeCount) / s.addStripeCount;
        for (let i = 0; i < s.addStripeCount; i++) {
          items.splice(i * step, 0, createItem());
        }
      }

      if (s.removeStripeCount) {
        const step = (items.length - s.removeStripeCount) / s.removeStripeCount;
        for (let i = 0; i < s.removeStripeCount; i++) {
          items.splice(i * step, 1);
        }
      }

      if (s.replaceStripeCount) {
        const step = items.length / s.replaceStripeCount;
        for (let i = 0; i < s.replaceStripeCount; i++) {
          items[i * step] = createItem();
        }
      }

      if (s.swapCount) {
        items = [
          ...items.slice(0, s.from),
          ...items.slice(s.to, s.to + s.swapCount),
          ...items.slice(s.from + s.swapCount, s.to),
          ...items.slice(s.from, s.from + s.swapCount),
          ...items.slice(s.to + s.swapCount),
        ];
      }

      if (s.moveCount) {
        if (s.from < s.to) {
          items = [
            ...items.slice(0, s.from),
            ...items.slice(s.from + s.moveCount, s.to),
            ...items.slice(s.from, s.from + s.moveCount),
            ...items.slice(s.to),
          ];
        } else {
          items = [
            ...items.slice(0, s.to),
            ...items.slice(s.from, s.from + s.moveCount),
            ...items.slice(s.to, s.from),
            ...items.slice(s.from + s.moveCount),
          ];
        }
        if (s.mirror) {
          const mfrom = items.length - s.from - s.moveCount;
          const mto = items.length - s.to;
          if (mfrom < mto) {
            items = [
              ...items.slice(0, mfrom),
              ...items.slice(mfrom + s.moveCount, mto),
              ...items.slice(mfrom, mfrom + s.moveCount),
              ...items.slice(mto),
            ];
          } else {
            items = [
              ...items.slice(0, mto),
              ...items.slice(mfrom, mfrom + s.moveCount),
              ...items.slice(mto, mfrom),
              ...items.slice(mfrom + s.moveCount),
            ];
          }
        }
      }

      if (s.reverseCount) {
        items = [
          ...items.slice(0, s.from),
          ...items.slice(s.from, s.to).reverse(),
          ...items.slice(s.to),
        ];
      }

      if (s.shuffleCount) {
        const shuffled = items.slice(s.from, s.to);
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        items = [...items.slice(0, s.from), ...shuffled, ...items.slice(s.to)];
      }

      // TODO(kschaaf): Accumulate measurements around just the render
      // once/if https://github.com/Polymer/tachometer/issues/196 is resolved
      // performance.mark(`${step}-start`);
      render(renderTemplate(items, renderItem), container);
      // performance.measure(step, `${step}-start`);
    }
    performance.measure(step, `${step}-start`);
  }
}
performance.measure('update', `update-start`);
performance.measure('total', 'render-start');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).tachometerResult =
  performance.getEntriesByName('total')[0].duration;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
document.title = (window as any).tachometerResult.toFixed(2) + 'ms';
console.table({
  ...Object.keys(routine).reduce(
    (p: {[index: string]: number}, n) => (
      (p[n] = performance
        .getEntriesByName(n)
        .reduce((p, n) => p + n.duration, 0)),
      p
    ),
    {}
  ),
  update: performance
    .getEntriesByName('update')
    .reduce((p, n) => p + n.duration, 0),
  total: performance.getEntriesByName('total')[0].duration,
  'items.length (at end)': items.length,
});

// Put items & render on window for debugging
Object.assign(window, {
  items,
  render: (step = 'render') => {
    const t = methods[routine[step].method || defaults.method];
    const i = itemTemplates[routine[step].itemType || defaults.itemType];
    render(t(items, i), container);
  },
});

// Debug helper
const error = (msg: string) => {
  console.log(items.map((i) => i.id));
  console.error(msg);
  const div = document.createElement('div');
  div.innerHTML = `<span style="color:red;font-size:2em;">${msg}</span>`;
  document.body.insertBefore(div, document.body.firstChild);
};

// Assert items were rendered in correct order
if (container.firstElementChild!.children.length !== items.length) {
  error(`Length mismatch!`);
} else {
  for (
    let e = container.firstElementChild!.firstElementChild!, i = 0;
    e;
    e = e.nextElementSibling!, i++
  ) {
    if (!items[i] || !e.textContent!.includes(items[i].text)) {
      error(`Mismatch at ${i}`);
      break;
    }
  }
}
