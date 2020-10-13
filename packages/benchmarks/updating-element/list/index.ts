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
import {UpdatingElement, PropertyDeclaration} from 'updating-element';
import {property, customElement} from 'updating-element/decorators.js';
import {queryParams} from '../../utils/query-params.js';

// Settings
const itemCount = 250;
const itemValueCount = 99;
const updateCount = 6;

type SimpleItem = {[index: string]: string};

function makeItem(prefix: number) {
  let o: SimpleItem = {};
  for (let i = 0; i < itemValueCount; i++) {
    o['value' + i] = prefix + ': ' + i;
  }
  return o;
}

function generateData(count: number) {
  let data = [];
  for (let i = 0; i < count; i++) {
    data.push(makeItem(i));
  }
  return data;
}

const data = generateData(itemCount);
const otherData = generateData(itemCount * 2).slice(itemCount);

const propertyOptions: PropertyDeclaration = {};

@customElement('x-thing')
export class XThing extends UpdatingElement {
  @property(propertyOptions)
  from = '';
  @property(propertyOptions)
  time = '';
  @property(propertyOptions)
  subject = '';
  fromEl!: HTMLSpanElement;
  timeEl!: HTMLSpanElement;
  subjectEl!: HTMLDivElement;

  protected firstUpdated() {
    const container = document.createElement('div');
    container.className = 'container';
    this.fromEl = document.createElement('span');
    this.fromEl.className = 'from';
    container.appendChild(this.fromEl);
    this.timeEl = document.createElement('span');
    this.timeEl.className = 'time';
    container.appendChild(this.timeEl);
    this.subjectEl = document.createElement('div');
    this.subjectEl.className = 'subject';
    container.appendChild(this.subjectEl);
    this.appendChild(container);
  }

  protected updated() {
    this.fromEl.textContent = this.from;
    this.timeEl.textContent = this.time;
    this.subjectEl.textContent = this.subject;
  }
}

@customElement('x-item')
export class XItem extends UpdatingElement {
  @property()
  item!: SimpleItem;
  count = 6;
  things: XThing[] = [];

  protected firstUpdated() {
    const container = this.appendChild(document.createElement('div'));
    container.className = 'item';
    for (let i = 0; i < this.count; i++) {
      this.things.push(
        container.appendChild(document.createElement('x-thing')) as XThing
      );
    }
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

  protected updated() {
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
}

@customElement('x-app')
export class XApp extends UpdatingElement {
  @property()
  items = data;
  itemEls: XItem[] = [];

  protected firstUpdated() {
    this.items.forEach(() => {
      this.itemEls.push(
        this.appendChild(document.createElement('x-item')) as XItem
      );
    });
  }

  protected updated() {
    this.items.forEach((item, i) => (this.itemEls[i].item = item));
  }
}

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
      (propertyOptions as any).reflect = true;
      for (let i = 0; i < updateCount; i++) {
        el.items = i % 2 ? otherData : data;
        await updateComplete();
      }
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
