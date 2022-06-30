/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement} from 'lit-element';
import {classMap} from 'lit-html/directives/class-map.js';
import {repeat} from 'lit-html/directives/repeat.js';
import {state} from 'lit-element/decorators/state.js';

/**
 * This benchmark renders templates, updates templates and nop-updates.
 *
 * In each of these benchmarks we measure the performance of using classMap.
 *
 * The benchmark itself creates a list of elements, and then selects one of
 * them, requiring classMap changes.
 */

interface IData {
  id: number;
  label: string;
}

function generateData(number: number): IData[] {
  const data = [];
  for (let idx = 0; idx < number; idx++) {
    data.push({id: idx, label: 'test-label'});
  }
  return data;
}

(async () => {
  // Settings
  const itemCount = 1000;
  const updateCount = 10;

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
              class="${classMap({
                class1: true,
                class2: true,
                class3: true,
                class4: true,
                class5: true,
                class6: true,
                class7: true,
                class8: true,
                // Class that changes a lot based on 'this.selected'.
                class9: (item.id + this.selected) % 2 === 0,
                danger: item.id === this.selected,
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

    const getTestStartName = (name: string) => `${name}-start`;

    // Named functions are use to run the measurements so that they can be
    // selected in the DevTools profile flame chart.

    // Initial Render
    const render = async () => {
      const test = 'render';
      const start = getTestStartName(test);
      performance.mark(start);
      create();
      await updateComplete();
      performance.measure(test, start);
      destroy();
    };
    await render();

    // Update: change selected data
    const update = async () => {
      const test = 'update';
      el = create();
      const start = getTestStartName(test);
      let selected = 1;
      performance.mark(start);
      for (let i = 0; i < updateCount; i++) {
        // Increment the selected index.
        el.selected = selected++;
        await updateComplete();
        // Force a style recalc.
        window.getComputedStyle(el);
      }
      performance.measure(test, start);
      destroy();
    };
    await update();

    // Update: toggle update but with no render changes.
    const nopupdate = async () => {
      const test = 'nop-update';
      el = create();
      const start = getTestStartName(test);
      performance.mark(start);
      for (let i = 0; i < updateCount; i++) {
        // nop update since state hasn't changed.
        el.requestUpdate();
        await updateComplete();
        // Force a style recalc.
        window.getComputedStyle(el);
      }
      performance.measure(test, start);
      destroy();
    };
    await nopupdate();

    const updateAndNopUpdate = async () => {
      const test = 'update-and-nop';
      el = create();
      let selected = 1;
      const start = getTestStartName(test);
      performance.mark(start);
      for (let i = 0; i < updateCount; i++) {
        // Increment the selected index.
        el.selected = selected++;
        await updateComplete();
        // nop update since state hasn't changed.
        el.requestUpdate();
        await updateComplete();
        // Force a style recalc.
        window.getComputedStyle(el);
      }
      performance.measure(test, start);
      destroy();
    };
    await updateAndNopUpdate();

    // Log
    performance
      .getEntriesByType('measure')
      .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
  })();
})();
