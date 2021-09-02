/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement} from 'lit-element';
import {repeat} from 'lit-html/directives/repeat.js';
import {classMap} from 'lit-html/directives/class-map.js';
import {queryParams} from '../../utils/query-params.js';

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
  // This uses a stripped down classMap directive.
  SimpleImplementation,
  // No directive, only string concatenation.
  StringConcatenation,
}

function simpleClassMap(classInfo: Record<string, boolean>) {
  // Render implementation from classMap directive.
  return Object.keys(classInfo)
    .filter((key) => classInfo[key])
    .join(' ');
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
  const itemCount = 1000;
  const updateCount = 30;

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
                    dynamicClass: true,
                    danger: item.id === this.selected,
                    normal: item.id !== this.selected,
                    ['static-class']: true,
                    class1: true,
                    class2: true,
                    class3: false,
                  })}"
                >
                  ${item.label}
                </li>
              `
            )}
          </ul>`;
        case DirectiveVariant.SimpleImplementation:
          return html`<ul>
            ${repeat(
              this.rows,
              (item: IData) => item.id,
              (item: IData) => html`
                <li
                  id="${item.id}"
                  class="${simpleClassMap({
                    dynamicClass: true,
                    danger: item.id === this.selected,
                    normal: item.id !== this.selected,
                    ['static-class']: true,
                    class1: true,
                    class2: true,
                    class3: false,
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
                  class="static-class class1 class2 ${true
                    ? 'dynamicClass'
                    : ''} ${item.id === this.selected ? 'danger' : ''}
                    ${item.id !== this.selected ? 'normal' : ''} ${false
                    ? 'class3'
                    : ''}"
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
    if (classVariant === 'simple') {
      variant = DirectiveVariant.SimpleImplementation;
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
      let selected = Math.floor((Math.random() * itemCount) / 2); // Choose item in first half.
      performance.mark(start);
      for (let i = 0; i < updateCount; i++) {
        // Increment the selected index.
        el.selected = selected++;
        await updateComplete();
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
      }
      performance.measure(test, start);
      destroy();
    };
    await nopupdate();

    // Log
    performance
      .getEntriesByType('measure')
      .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
  })();
})();
