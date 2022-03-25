var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, LitElement, css, render} from 'lit';
import {customElement, property} from 'lit/decorators.js';
const queryParams = document.location.search
  .slice(1)
  .split('&')
  .filter((s) => s)
  .map((p) => p.split('='))
  .reduce(
    (p, [k, v]) => (
      (p[k] = (() => {
        try {
          return JSON.parse(v);
        } catch {
          return v || true;
        }
      })()),
      p
    ),
    {}
  );
// Settings
const itemCount = 250;
const itemValueCount = 99;
const updateCount = 6;
function makeItem(prefix) {
  const o = {};
  for (let i = 0; i < itemValueCount; i++) {
    o['value' + i] = prefix + ': ' + i;
  }
  return o;
}
function generateData(count) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(makeItem(i));
  }
  return data;
}
const data = generateData(itemCount);
const otherData = generateData(itemCount * 2).slice(itemCount);
const propertyOptions = {};
let XThing = class XThing extends LitElement {
  constructor() {
    super(...arguments);
    this.from = '';
    this.time = '';
    this.subject = '';
  }
  render() {
    return html`
      <div class="container">
        <span class="from">${this.from}</span>
        <span class="time">${this.time}</span>
        <div class="subject">${this.subject}</div>
      </div>
    `;
  }
};
XThing.styles = css`
  .container {
    box-sizing: border-box;
    height: 80px;
    padding: 4px;
    padding-left: 77px;
    line-height: 167%;
    cursor: default;
    background-color: white;
    position: relative;
    color: black;
    background-repeat: no-repeat;
    background-position: 10px 10px;
    background-size: 60px;
    border-bottom: 1px solid #ddd;
  }

  .from {
    display: inline;
    font-weight: bold;
  }

  .time {
    margin-left: 10px;
    font-size: 12px;
    opacity: 0.8;
  }
`;
__decorate([property(propertyOptions)], XThing.prototype, 'from', void 0);
__decorate([property(propertyOptions)], XThing.prototype, 'time', void 0);
__decorate([property(propertyOptions)], XThing.prototype, 'subject', void 0);
XThing = __decorate([customElement('x-thing')], XThing);
export {XThing};
let XItem = class XItem extends LitElement {
  render() {
    return html`
      <div @click="${this.onClick}" class="item">
        <x-thing
          .from="${this.item.value0}"
          .time="${this.item.value1}"
          .subject="${this.item.value2}"
        ></x-thing>
        <x-thing
          .from="${this.item.value3}"
          .time="${this.item.value4}"
          .subject="${this.item.value5}"
        ></x-thing>
        <x-thing
          .from="${this.item.value6}"
          .time="${this.item.value7}"
          .subject="${this.item.value8}"
        ></x-thing>
        <x-thing
          .from="${this.item.value9}"
          .time="${this.item.value10}"
          .subject="${this.item.value11}"
        ></x-thing>
        <x-thing
          .from="${this.item.value12}"
          .time="${this.item.value13}"
          .subject="${this.item.value14}"
        ></x-thing>
        <x-thing
          .from="${this.item.value15}"
          .time="${this.item.value16}"
          .subject="${this.item.value17}"
        ></x-thing>
      </div>
    `;
  }
  onClick(e) {
    console.log(e.type);
  }
};
XItem.styles = css`
  .item {
    display: flex;
  }
`;
__decorate([property()], XItem.prototype, 'item', void 0);
XItem = __decorate([customElement('x-item')], XItem);
export {XItem};
let XApp = class XApp extends LitElement {
  constructor() {
    super(...arguments);
    this.items = data;
  }
  render() {
    return html`${this.items.map(
      (item) => html`<x-item .item="${item}"></x-item>`
    )}`;
  }
};
__decorate([property()], XApp.prototype, 'items', void 0);
XApp = __decorate([customElement('x-app')], XApp);
export {XApp};
(async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let el;
  const create = () => {
    render(html`<x-app></x-app>`, document.body);
    return document.body.firstElementChild;
  };
  const destroy = () => {
    container.innerHTML = '';
  };
  const updateComplete = () => new Promise((r) => requestAnimationFrame(r));
  const benchmark = queryParams['benchmark'];
  const getTestStartName = (name) => `${name}-start`;
  // Named functions are use to run the measurements so that they can be
  // selected in the DevTools profile flame chart.
  // Initial Render
  const initialRender = async () => {
    const test = 'render';
    if (benchmark === test || !benchmark) {
      const start = getTestStartName(test);
      performance.mark(start);
      create();
      await updateComplete();
      performance.measure(test, start);
      destroy();
    }
  };
  await initialRender();
  // Update: toggle data
  const update = async () => {
    const test = 'update';
    if (benchmark === test || !benchmark) {
      el = create();
      const start = getTestStartName(test);
      performance.mark(start);
      for (let i = 0; i < updateCount; i++) {
        el.items = i % 2 ? otherData : data;
        await updateComplete();
      }
      performance.measure(test, start);
      destroy();
    }
  };
  await update();
  const updateReflect = async () => {
    const test = 'update-reflect';
    if (benchmark === test || !benchmark) {
      el = create();
      const start = getTestStartName(test);
      performance.mark(start);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      propertyOptions.reflect = true;
      for (let i = 0; i < updateCount; i++) {
        el.items = i % 2 ? otherData : data;
        await updateComplete();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      propertyOptions.reflect = false;
      performance.measure(test, start);
      destroy();
    }
  };
  await updateReflect();
  // Log
  performance
    .getEntriesByType('measure')
    .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
})();
//# sourceMappingURL=index.js.map
