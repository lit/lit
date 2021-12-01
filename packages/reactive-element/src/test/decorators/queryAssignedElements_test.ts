/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {queryAssignedElements} from '../../decorators/query-assigned-elements.js';
import {
  canTestReactiveElement,
  generateElementName,
  RenderingElement,
  html,
} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

const flush =
  window.ShadyDOM && window.ShadyDOM.flush ? window.ShadyDOM.flush : () => {};

(canTestReactiveElement ? suite : suite.skip)('@queryAssignedElements', () => {
  let container: HTMLElement;
  let el: C;

  class D extends RenderingElement {
    @queryAssignedElements() defaultAssigned!: Element[];

    @queryAssignedElements({slotName: 'footer', flatten: true})
    footerAssigned!: Element[];

    @queryAssignedElements({slotName: 'footer', flatten: false})
    footerNotFlattenedSlot!: Element[];

    @queryAssignedElements({
      slotName: 'footer',
      flatten: true,
      selector: '.item',
    })
    footerAssignedFiltered!: Element[];

    override render() {
      return html`
        <slot></slot>
        <slot name="footer"></slot>
      `;
    }
  }
  customElements.define('assigned-elements-el', D);

  class E extends RenderingElement {
    @queryAssignedElements() defaultAssigned!: Element[];

    @queryAssignedElements({slotName: 'header'}) headerAssigned!: Element[];

    override render() {
      return html`
        <slot name="header"></slot>
        <slot></slot>
      `;
    }
  }
  customElements.define('assigned-elements-el-2', E);

  const defaultSymbol = Symbol('default');
  const headerSymbol = Symbol('header');
  class S extends RenderingElement {
    @queryAssignedElements() [defaultSymbol]!: Element[];

    @queryAssignedElements({slotName: 'header'}) [headerSymbol]!: Element[];

    override render() {
      return html`
        <slot name="header"></slot>
        <slot></slot>
      `;
    }
  }
  customElements.define('assigned-elements-el-symbol', S);

  // Note, there are 2 elements here so that the `flatten` option of
  // the decorator can be tested.
  class C extends RenderingElement {
    div!: HTMLDivElement;
    div2!: HTMLDivElement;
    div3!: HTMLDivElement;
    assignedEls!: D;
    assignedEls2!: E;
    assignedEls3!: S;
    @queryAssignedElements() missingSlotAssignedElements!: Element[];

    override render() {
      return html`
        <assigned-elements-el
          ><div id="div1">A</div>
          <slot slot="footer"></slot
        ></assigned-elements-el>
        <assigned-elements-el-2><div id="div2">B</div></assigned-elements-el-2>
        <assigned-elements-el-symbol
          ><div id="div3">B</div></assigned-elements-el-symbol
        >
      `;
    }

    override firstUpdated() {
      this.div = this.renderRoot.querySelector('#div1') as HTMLDivElement;
      this.div2 = this.renderRoot.querySelector('#div2') as HTMLDivElement;
      this.div3 = this.renderRoot.querySelector('#div3') as HTMLDivElement;
      this.assignedEls = this.renderRoot.querySelector(
        'assigned-elements-el'
      ) as D;
      this.assignedEls2 = this.renderRoot.querySelector(
        'assigned-elements-el-2'
      ) as E;
      this.assignedEls3 = this.renderRoot.querySelector(
        'assigned-elements-el-symbol'
      ) as S;
    }
  }
  customElements.define(generateElementName(), C);

  setup(async () => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    el = new C();
    container.appendChild(el);
    await el.updateComplete;
    await el.assignedEls.updateComplete;
  });

  teardown(() => {
    if (container !== undefined) {
      container.parentElement!.removeChild(container);
      (container as any) = undefined;
    }
  });

  test('returns assignedElements for slot', () => {
    // Note, `defaultAssigned` does not `flatten` so we test that the property
    // reflects current state and state when nodes are added or removed.
    assert.deepEqual(el.assignedEls.defaultAssigned, [el.div]);
    const child = document.createElement('div');
    const text1 = document.createTextNode('');
    el.assignedEls.appendChild(text1);
    el.assignedEls.appendChild(child);
    const text2 = document.createTextNode('');
    el.assignedEls.appendChild(text2);
    flush();
    assert.deepEqual(el.assignedEls.defaultAssigned, [el.div, child]);
    el.assignedEls.removeChild(child);
    flush();
    assert.deepEqual(el.assignedEls.defaultAssigned, [el.div]);
  });

  test('returns assignedElements for unnamed slot that is not first slot', () => {
    assert.deepEqual(el.assignedEls2.defaultAssigned, [el.div2]);
  });

  test('returns assignedElements for unnamed slot via symbol property', () => {
    assert.deepEqual(el.assignedEls3[defaultSymbol], [el.div3]);
  });

  test('returns flattened assignedElements for slot', () => {
    assert.deepEqual(el.assignedEls.footerAssigned, []);
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    el.appendChild(child1);
    el.appendChild(child2);
    flush();
    assert.deepEqual(el.assignedEls.footerAssigned, [child1, child2]);

    assert.equal(el.assignedEls.footerNotFlattenedSlot.length, 1);
    assert.equal(el.assignedEls.footerNotFlattenedSlot?.[0]?.tagName, 'SLOT');

    el.removeChild(child2);
    flush();
    assert.deepEqual(el.assignedEls.footerAssigned, [child1]);
  });

  test('always returns an array, even if the slot is not rendered', () => {
    assert.isArray(el.missingSlotAssignedElements);
  });

  test('returns assignedElements for slot filtered by selector', () => {
    assert.deepEqual(el.assignedEls.footerAssignedFiltered, []);
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    child2.classList.add('item');
    el.appendChild(child1);
    el.appendChild(child2);
    flush();
    assert.deepEqual(el.assignedEls.footerAssignedFiltered, [child2]);
    el.removeChild(child2);
    flush();
    assert.deepEqual(el.assignedEls.footerAssignedFiltered, []);
  });
});
