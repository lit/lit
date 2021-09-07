/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { html, LitElement } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { queryParams } from '../../utils/query-params.js';

/**
 * This benchmark renders templates, updates templates and nop-updates.
 *
 * In each of these benchmarks we measure between 2 variants of classmaps,
 * and raw string manipulation.
 *
 * The benchmark itself creates a list of elements, and then selects one of
 * them.
 */

interface IData {
  id: number;
  label: string;
}

enum DirectiveVariant {
  // This uses the imported classMap directive.
  CurrentImplementation,
  // No directive, only string concatenation.
  StringConcatenation,
}


function generateData(number = 1000): IData[] {
  const data = [];
  for (let idx = 0; idx < number; idx++) {
    data.push({ id: idx, label: 'test-label' });
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
  const { state } = decorators;
  // Settings
  const itemCount = 5000;
  const updateCount = 100;

  const data = generateData(itemCount);

  class XApp extends LitElement {
    @state()
    rows = data;

    @state()
    selected = -1;

    variant!: DirectiveVariant;

    protected override render() {
      switch (this.variant) {
        case DirectiveVariant.CurrentImplementation:
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
              class9: true,
              danger: item.id == this.selected,
            })}"
                >
                  ${item.label}
                </li>
              `
          )}
          </ul>`;
        case DirectiveVariant.StringConcatenation:
          return html`<ul>
            ${repeat(
            this.rows,
            (item: IData) => item.id,
            (item: IData) => html`
                <li
                  id="${item.id}"
                  class="class1 class2 clas3 class4 class5 class6 class7 class8 class9 ${item.id == this.selected ? 'danger' : ''}"
                >
                  ${item.label}
                </li>
              `
          )}
          </ul>`;
      }
    }
  }
  customElements.define('x-app', XApp);

  (async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let el: XApp;

    const classVariant = (queryParams.classVariant as unknown as string) ?? '';

    let variant: DirectiveVariant = DirectiveVariant.CurrentImplementation;
    if (classVariant === 'class-string-interpolation') {
      variant = DirectiveVariant.StringConcatenation;
    }

    const create = () => {
      const el = document.createElement('x-app') as XApp;
      el.variant = variant;
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

    // Update: toggle data
    const update = async () => {
      const test = 'update';
      el = create();
      const start = getTestStartName(test);
      let selected = 1
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
        (el as LitElement).requestUpdate();
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
      const halfCount = Math.ceil(updateCount / 2); // This loop is starting to time out.
      for (let i = 0; i < halfCount; i++) {
        // Increment the selected index.
        el.selected = selected++;
        await updateComplete();
        // nop update since state hasn't changed.
        (el as LitElement).requestUpdate();
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
