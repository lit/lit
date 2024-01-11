/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {queryAssignedElements} from '@lit/reactive-element/decorators/query-assigned-elements.js';
import {customElement} from '@lit/reactive-element/decorators/custom-element.js';
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

  @customElement('assigned-elements-el')
  class D extends RenderingElement {
    @queryAssignedElements() defaultAssigned!: Element[];

    @queryAssignedElements({slot: 'footer', flatten: true})
    footerAssigned!: Element[];

    @queryAssignedElements({slot: 'footer', flatten: false})
    footerNotFlattenedSlot!: Element[];

    @queryAssignedElements({
      slot: 'footer',
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

  const defaultSymbol = Symbol('default');
  @customElement('assigned-elements-el-2')
  class E extends RenderingElement {
    @queryAssignedElements() [defaultSymbol]!: Element[];

    @queryAssignedElements({slot: 'header'}) headerAssigned!: Element[];

    override render() {
      return html`
        <slot name="header"></slot>
        <slot></slot>
      `;
    }
  }

  // Note, there are 2 elements here so that the `flatten` option of
  // the decorator can be tested.
  @customElement(generateElementName())
  class C extends RenderingElement {
    div!: HTMLDivElement;
    div2!: HTMLDivElement;
    div3!: HTMLDivElement;
    assignedEls!: D;
    assignedEls2!: E;
    @queryAssignedElements() missingSlotAssignedElements!: Element[];

    override render() {
      return html`
        <assigned-elements-el
          ><div id="div1">A</div>
          <slot slot="footer"></slot
        ></assigned-elements-el>
        <assigned-elements-el-2><div id="div2">B</div></assigned-elements-el-2>
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
    }
  }

  setup(async () => {
    container = document.createElement('div');
    document.body.append(container);
    el = new C();
    container.append(el);
    await new Promise((r) => setTimeout(r, 0));
  });

  teardown(() => {
    container?.remove();
  });

  test('returns assignedElements for slot', () => {
    // Note, `defaultAssigned` does not `flatten` so we test that the property
    // reflects current state and state when nodes are added or removed.
    assert.deepEqual(el.assignedEls.defaultAssigned, [el.div]);
    const child = document.createElement('div');
    const text1 = document.createTextNode('');
    el.assignedEls.append(text1, child);
    const text2 = document.createTextNode('');
    el.assignedEls.append(text2);
    flush();
    assert.deepEqual(el.assignedEls.defaultAssigned, [el.div, child]);
    child.remove();
    flush();
    assert.deepEqual(el.assignedEls.defaultAssigned, [el.div]);
  });

  test('returns assignedElements for unnamed slot that is not first slot', () => {
    assert.deepEqual(el.assignedEls2[defaultSymbol], [el.div2]);
  });

  test('returns flattened assignedElements for slot', () => {
    assert.deepEqual(el.assignedEls.footerAssigned, []);
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    el.append(child1, child2);
    flush();
    assert.deepEqual(el.assignedEls.footerAssigned, [child1, child2]);

    assert.equal(el.assignedEls.footerNotFlattenedSlot.length, 1);
    assert.equal(el.assignedEls.footerNotFlattenedSlot?.[0]?.tagName, 'SLOT');

    child2.remove();
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
    el.append(child1, child2);
    flush();
    assert.deepEqual(el.assignedEls.footerAssignedFiltered, [child2]);
    child2.remove();
    flush();
    assert.deepEqual(el.assignedEls.footerAssignedFiltered, []);
  });
});
