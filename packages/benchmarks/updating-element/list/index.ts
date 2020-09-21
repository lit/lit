import {
  UpdatingElement,
  PropertyDeclaration,
  PropertyValues,
} from 'lit-element/lib/updating-element.js';
import {property, customElement} from 'lit-element/lib/decorators.js';

// IE doesn't support URLSearchParams
const params = document.location.search
  .slice(1)
  .split('&')
  .map((p) => p.split('='))
  .reduce((p: {[key: string]: any}, [k, v]) => ((p[k] = v || true), p), {});

type SimpleItem = {[index: string]: string};

function makeItem(prefix: number) {
  let o: SimpleItem = {};
  for (let i = 0; i < 99; i++) {
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

const data = generateData(250);
const otherData = generateData(500).slice(250);

const propertyOptions: PropertyDeclaration = {};

let updates: Promise<unknown>[] = [];
const updateComplete = async () => {
  const waitFor = updates;
  updates = [];
  // console.log('updateComplete', waitFor.length);
  await Promise.all(waitFor);
  if (updates.length) {
    await updateComplete();
  } else {
    // await new Promise(r => setTimeout(r, 1000));
  }
};

// Make compatible with previous version
if (Boolean((UpdatingElement.prototype as any).requestUpdateInternal)) {
  UpdatingElement.prototype.requestUpdate = (UpdatingElement.prototype as any).requestUpdateInternal;
}

class MonitorUpdate extends UpdatingElement {
  // Make compatible with previous version
  requestUpdateInternal(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration
  ) {
    this.requestUpdate(name, oldValue, options);
  }

  requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration
  ) {
    const pending = (this as any)._hasRequestedUpdate;
    super.requestUpdate(name, oldValue, options);
    if (!pending && this.hasUpdated) {
      updates.push(this.updateComplete);
    }
  }

  update(changedProperties: PropertyValues) {
    if (!this.hasUpdated) {
      updates.push(this.updateComplete);
    }
    super.update(changedProperties);
  }
}

@customElement('x-thing')
export class XThing extends MonitorUpdate {
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
export class XItem extends MonitorUpdate {
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
export class XApp extends MonitorUpdate {
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

  const benchmark = params.benchmark;
  const start = 'start';

  // Initial Render
  let test = 'render';
  if (benchmark === test || !benchmark) {
    performance.mark(`${test}${start}`);
    create();
    await updateComplete();
    performance.measure(test, `${test}${start}`);
    destroy();
  }

  // Update: toggle data
  const updateCount = 6;
  test = 'update';
  if (benchmark === test || !benchmark) {
    el = create();
    performance.mark(`${test}${start}`);
    for (let i = 0; i < updateCount; i++) {
      el.items = i % 2 ? otherData : data;
      await updateComplete();
    }
    performance.measure(test, `${test}${start}`);
    destroy();
  }

  test = 'update-reflect';
  if (benchmark === test || !benchmark) {
    el = create();
    performance.mark(`${test}${start}`);
    (propertyOptions as any).reflect = true;
    for (let i = 0; i < updateCount; i++) {
      el.items = i % 2 ? otherData : data;
      await updateComplete();
    }
    (propertyOptions as any).reflect = false;
    performance.measure(test, `${test}${start}`);
    destroy();
  }

  // Log
  performance
    .getEntriesByType('measure')
    .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
})();
