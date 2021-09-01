/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, LitElement} from 'lit-element';
import {repeat} from 'lit-html/directives/repeat.js';
import {classMap} from 'lit-html/directives/class-map.js';
import {queryParams} from '../../utils/query-params.js';

interface IData {
  id: number;
  label: string;
}

function generateData(number = 1000): IData[] {
  const data = [];
  for (let idx = 0; idx < number; idx++) {
    data.push({id: idx, label: 'test-label'});
  }
  return data;
}

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
  const {state} = decorators;
  // Settings
  const itemCount = 500;
  const updateCount = 6;

  const data = generateData(itemCount);

  class XApp extends LitElement {
    @state()
    rows = data;

    @state()
    selected = -1;

    protected override render() {
      return html`<ul>
        ${repeat(
          this.rows,
          (item: IData) => item.id,
          (item: IData) => html`
            <li
              id="${item.id}"
              class="static-class ${classMap({
                dynamicClass: true,
                danger: item.id == this.selected,
              })}"
            >
              ${item.label}
            </li>
          `
        )}
      </ul>`;
    }
  }
  customElements.define('x-app', XApp);

  (async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let el: XApp;

    const create = () => {
      const el = document.createElement('x-app') as XApp;
      return container.appendChild(el);
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
        let selected = Math.floor((Math.random() * itemCount) / 2); // Choose item in first half.
        performance.mark(start);
        for (let i = 0; i < updateCount; i++) {
          // Increment the selected index.
          el.selected = selected++;
          await updateComplete();
        }
        performance.measure(test, start);
        destroy();
      }
    };
    await update();

    // Update: toggle update but with no render changes.
    const nopupdate = async () => {
      const test = 'nop-update';
      if (benchmark === test || !benchmark) {
        el = create();
        const start = getTestStartName(test);
        performance.mark(start);
        for (let i = 0; i < updateCount; i++) {
          // nop update since state hasn't changed.
          (el as LitElement).requestUpdate();
        }
        performance.measure(test, start);
        destroy();
      }
    };
    await nopupdate();

    // Log
    performance
      .getEntriesByType('measure')
      .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
  })();
})();
