/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, LitElement, css, PropertyDeclaration} from 'lit-element';
import {queryParams} from '../../utils/query-params.js';

(async () => {
  // Note, `decorators.js` moved from the `lib` folder to top level
  // between 2.x and 3.x. Handle this by trying to import
  // from each location.
  let decorators;
  try {
    decorators = await import('lit-element/decorators.js');
  } catch (e) {
    decorators = await (import(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      'lit-element/lib/decorators.js'
    ) as unknown as typeof import('lit-element/decorators.js'));
  }
  const {property} = decorators;
  // Settings
  const itemCount = 250;
  const itemValueCount = 99;
  const updateCount = 6;

  type SimpleItem = {[index: string]: string};

  function makeItem(prefix: number) {
    const o: SimpleItem = {};
    for (let i = 0; i < itemValueCount; i++) {
      o['value' + i] = prefix + ': ' + i;
    }
    return o;
  }

  function generateData(count: number) {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push(makeItem(i));
    }
    return data;
  }

  const data = generateData(itemCount);
  const otherData = generateData(itemCount * 2).slice(itemCount);

  const propertyOptions: PropertyDeclaration = {};

  class XThing extends LitElement {
    static override styles = css`
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

    @property(propertyOptions)
    from = '';
    @property(propertyOptions)
    time = '';
    @property(propertyOptions)
    subject = '';

    protected override render() {
      return html`
        <div class="container">
          <span class="from">${this.from}</span>
          <span class="time">${this.time}</span>
          <div class="subject">${this.subject}</div>
        </div>
      `;
    }
  }
  customElements.define('x-thing', XThing);

  class XItem extends LitElement {
    static override styles = css`
      .item {
        display: flex;
      }
    `;

    @property()
    item!: SimpleItem;

    protected override render() {
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

    onClick(e: MouseEvent) {
      console.log(e.type);
    }
  }
  customElements.define('x-item', XItem);

  class XApp extends LitElement {
    @property()
    items = data;

    protected override render() {
      return html`${this.items.map(
        (item) => html`<x-item .item="${item}"></x-item>`
      )}`;
    }
  }
  customElements.define('x-app', XApp);

  (async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let el: XApp;

    const create = () => {
      const el = document.createElement('x-app') as XApp;
      return container.appendChild(el) as XApp;
    };

    const destroy = () => {
      container.innerHTML = '';
    };

    const updateComplete = () => new Promise((r) => requestAnimationFrame(r));

    const benchmark = queryParams.benchmark;
    const getTestStartName = (name: string) => `${name}-start`;

    // Named functions are use to run the measurements so that they can be
    // selected in the DevTools profile flame chart.

    // Initial Render
    const render = async () => {
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
    await render();

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
        (propertyOptions as any).reflect = true;
        for (let i = 0; i < updateCount; i++) {
          el.items = i % 2 ? otherData : data;
          await updateComplete();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (propertyOptions as any).reflect = false;
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
})();
