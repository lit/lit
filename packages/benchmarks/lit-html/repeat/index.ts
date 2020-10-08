import {repeat} from 'lit-html/directives/repeat.js';
import {render, html} from 'lit-html';

// IE doesn't support URLSearchParams
const params = document.location.search
  .slice(1)
  .split('&')
  .filter(s => s)
  .map((p) => p.split('='))
  .reduce(
    // convert boolean, number, strings and default empty to true
    (p: {[key: string]: string|boolean}, [k, v]) => ((p[k] = (() => { try { return JSON.parse(v) } catch { return v || true }})(), p),
    {}
  );

const defaults = {
  method: 'repeat' as keyof typeof methods,
  itemType: 'li' as keyof typeof itemTemplates,
  initialCount: 1000,
  removeCount: 0,
  moveCount: 0,
  addCount: 0,
  swapCount: 0,
  from: 2,
  to: 8,
  replace: false,
  reverse: false,
  shuffle: false,
  mirror: false,
  loopCount: 10
};

const preset: {[index: string]: (Partial<typeof defaults>)} = {
  render: {},
  nop: {},
  replace: {replace: true, loopCount: 2},
  add: {addCount: 10, to: 100, loopCount: 50},
  addMirror: {addCount: 10, to: 100, mirror: true, loopCount: 10},
  remove: {removeCount: 10, from: 100, loopCount: 50},
  removeMirror: {removeCount: 10, from: 100, mirror: true, loopCount: 10},
  reverse: {reverse: true},
  swapOne: {swapCount: 1, from: 100, to: 800, loopCount: 100},
  swapMany: {swapCount: 10, from: 100, to: 800},
  moveForwardOne: {moveCount: 1, from: 100, to: 800, loopCount: 100},
  moveForwardMany: {moveCount: 10, from: 100, to: 800},
  moveBackwardOne: {moveCount: 1, from: 800, to: 100, loopCount: 100},
  moveBackwardMany: {moveCount: 10, from: 800, to: 100},
  shuffle: {shuffle: true, loopCount: 5},
};

// If query params are provided, put that opreation in a `custom` step
const routine = (Object.keys(params).length === 0) ? preset : {
  render: {...params}, 
  custom: {...params}
};

let gid = 0;
const container = document.getElementById('container')!;
type Item = {
  id: number,
  text: string
};
const createItems = (count: number): Item[] => 
  new Array(count).fill(0).map(() => ({id: gid, text: `item ${gid++}`}));

const itemTemplates = {
  li: (item: Item) => html`<li>${item.text}</li>`,
  input: (item: Item) => html`<div>${item.text}: <input value="${item.text}"></div>`
}

const methods = {
  repeat(items: Item[], renderItem: (item: Item) => any) {
    return html`<ul>${repeat(items, item => item.id, renderItem)}</ul>`;
  },
  map(items: Item[], renderItem: (item: Item) => any) {
    return html`<ul>${items.map(renderItem)}</ul>`;
  }
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

    for (let i=0; i<s.loopCount; i++) {

      if (s.replace) {
        items = createItems(items.length);
      }

      if (s.removeCount) {
        items = items.filter((_, i) => i < s.from || i >= s.from + s.removeCount);
        if (s.mirror) {
          items = items.filter((_, i) => i < items.length - s.from-s.removeCount || i >= items.length - s.from);
        }
      }

      if (s.addCount) {
        items = [...items.slice(0, s.to), ...createItems(s.addCount), ...items.slice(s.to)];
        if (s.mirror) {
          items = [...items.slice(0, -s.to), ...createItems(s.addCount), ...items.slice(-s.to)];
        }
      }

      if (s.swapCount) {
        items = [
          ...items.slice(0, s.from),
          ...items.slice(s.to, s.to + s.swapCount),
          ...items.slice(s.from + s.swapCount, s.to),
          ...items.slice(s.from, s.from + s.swapCount),
          ...items.slice(s.to + s.swapCount)
        ];
      }

      if (s.moveCount) {
        if (s.from < s.to) {
          items = [
            ...items.slice(0, s.from),
            ...items.slice(s.from + s.moveCount, s.to),
            ...items.slice(s.from, s.from + s.moveCount),
            ...items.slice(s.to)
          ];
        } else {
          items = [
            ...items.slice(0, s.to),
            ...items.slice(s.from, s.from + s.moveCount),
            ...items.slice(s.to, s.from),
            ...items.slice(s.from + s.moveCount)
          ];
        }
        if (s.mirror) {
          let mfrom = items.length - s.from - s.moveCount;
          let mto = items.length - s.to;
          if (mfrom < mto) {
            items = [
              ...items.slice(0, mfrom),
              ...items.slice(mfrom + s.moveCount, mto),
              ...items.slice(mfrom, mfrom + s.moveCount),
              ...items.slice(mto)
            ];
          } else {
            items = [
              ...items.slice(0, mto),
              ...items.slice(mfrom, mfrom + s.moveCount),
              ...items.slice(mto, mfrom),
              ...items.slice(mfrom + s.moveCount)
            ];
          }
        }
      }

      if (s.reverse) {
        items = items.reverse();
      }

      if (s.shuffle) {
        items = items.slice();
        for (let i = items.length-1; i>0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }
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
performance.measure('update', `update-start`)
performance.measure('total', 'render-start');

(window as any).tachometerResult = performance.getEntriesByName('total')[0].duration;
document.title = (window as any).tachometerResult.toFixed(2) + 'ms';
console.table({
  ...Object.keys(routine).reduce((p: {[index: string]: number},n) => 
    (p[n] = performance.getEntriesByName(n).reduce((p, n) => p + n.duration, 0), p), {}),
  update: performance.getEntriesByName('update').reduce((p, n) => p + n.duration, 0),
  total: performance.getEntriesByName('total')[0].duration
});

// Put items & render on window for debugging
Object.assign(window, {
  items, 
  render: (step = 'render') => {
    const t = methods[routine[step].method || defaults.method];
    const i = itemTemplates[routine[step].itemType || defaults.itemType];
    render(t(items, i), container);
  }
});

// Debug helper
const error = (msg: string) => {
  console.log(items.map(i=>i.id));
  console.error(msg);
  const div = document.createElement('div');
  div.innerHTML = `<span style="color:red;font-size:2em;">${msg}</span>`;
  document.body.insertBefore(div, document.body.firstChild);
}

// Assert items were rendered in correct order
if (container.firstElementChild!.children.length !== items.length) {
  error(`Length mismatch!`);
} else {
  for (let e=container.firstElementChild!.firstElementChild!, i=0; e; e=e.nextElementSibling!, i++) {
    if (!items[i] || !e.textContent!.includes(items[i].text)) {
      error(`Mismatch at ${i}`);
      break;
    }
  }
}
