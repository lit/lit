/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {
  ReactiveElement,
  PropertyDeclaration,
  PropertyValues,
  css,
  Controller,
} from '@lit/reactive-element';
import {property} from '@lit/reactive-element/decorators.js';
import {queryParams} from '../../utils/query-params.js';

(async () => {
  // wait until after page loads
  if (document.readyState !== 'complete') {
    let resolve: () => void;
    const p = new Promise<void>((r) => (resolve = r));
    document.addEventListener('readystatechange', async () => {
      if (document.readyState === 'complete') {
        resolve();
      }
    });
    await p;
  }
  await new Promise((r) => setTimeout(r));

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

  const useController = queryParams.controller;

  class MyController implements Controller {
    host: ReactiveElement;
    isConnected = false;
    value = '';
    constructor(host: ReactiveElement) {
      this.host = host;
      this.host.addController(this);
    }
    connectedCallback() {
      this.isConnected = true;
    }
    disconnectedCallback() {
      this.isConnected = false;
    }
    willUpdate() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.value = (this.host as any).time;
    }
    updated() {}
  }

  class XThing extends ReactiveElement {
    static styles = css`
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
    fromEl!: HTMLSpanElement;
    timeEl!: HTMLSpanElement;
    subjectEl!: HTMLDivElement;

    controller = useController ? new MyController(this) : undefined;

    protected update(changedProperties: PropertyValues) {
      super.update(changedProperties);
      if (!this.hasUpdated) {
        const container = document.createElement('div');
        container.appendChild(document.createTextNode(' '));
        container.className = 'container';
        this.fromEl = document.createElement('span');
        this.fromEl.className = 'from';
        container.appendChild(this.fromEl);
        container.appendChild(document.createTextNode(' '));
        this.timeEl = document.createElement('span');
        this.timeEl.className = 'time';
        container.appendChild(this.timeEl);
        container.appendChild(document.createTextNode(' '));
        this.subjectEl = document.createElement('div');
        this.subjectEl.className = 'subject';
        container.appendChild(this.subjectEl);
        container.appendChild(document.createTextNode(' '));
        this.renderRoot.appendChild(document.createTextNode(' '));
        this.renderRoot.appendChild(container);
        this.renderRoot.appendChild(document.createTextNode(' '));
      }
      this.fromEl.textContent = this.from;
      this.timeEl.textContent = useController
        ? this.controller!.value
        : this.time;
      this.subjectEl.textContent = this.subject;
    }
  }
  customElements.define('x-thing', XThing);

  class XItem extends ReactiveElement {
    static styles = css`
      .item {
        display: flex;
      }
    `;

    @property()
    item!: SimpleItem;
    count = 6;
    things: XThing[] = [];

    protected update(changedProperties: PropertyValues) {
      super.update(changedProperties);
      if (!this.hasUpdated) {
        this.renderRoot.appendChild(document.createTextNode(' '));
        const container = this.renderRoot.appendChild(
          document.createElement('div')
        );
        this.renderRoot.appendChild(document.createTextNode(' '));
        container.className = 'item';
        container.appendChild(document.createTextNode(' '));
        for (let i = 0; i < this.count; i++) {
          this.things.push(
            container.appendChild(document.createElement('x-thing')) as XThing
          );
          container.appendChild(document.createTextNode(' '));
        }
      }
      let x = 0;
      this.things.forEach((thing) => {
        this.updateThing(
          thing,
          this.item[`value${x++}`],
          this.item[`value${x++}`],
          this.item[`value${x++}`]
        );
      });
    }

    private updateThing(
      thing: XThing,
      from: string,
      time: string,
      subject: string
    ) {
      thing.from = from;
      thing.time = time;
      thing.subject = subject;
    }
  }
  customElements.define('x-item', XItem);

  class XApp extends ReactiveElement {
    @property()
    items = data;
    itemEls: XItem[] = [];

    protected update(changedProperties: PropertyValues) {
      super.update(changedProperties);
      if (!this.hasUpdated) {
        this.items.forEach(() => {
          this.itemEls.push(
            this.renderRoot.appendChild(
              document.createElement('x-item')
            ) as XItem
          );
        });
      }
      this.items.forEach((item, i) => (this.itemEls[i].item = item));
    }
  }
  customElements.define('x-app', XApp);

  (async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let el: XApp;

    const create = () => {
      el = document.createElement('x-app') as XApp;
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
