/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {queryAssignedNodes} from '@lit/reactive-element/decorators/query-assigned-nodes.js';
import {queryAssignedElements} from '@lit/reactive-element/decorators/query-assigned-elements.js';
import {
  canTestReactiveElement,
  generateElementName,
  RenderingElement,
  html,
} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

const flush =
  window.ShadyDOM && window.ShadyDOM.flush ? window.ShadyDOM.flush : () => {};

(canTestReactiveElement ? suite : suite.skip)('@queryAssignedNodes', () => {
  let container: HTMLElement;
  let el: C;

  class D extends RenderingElement {
    @queryAssignedNodes() defaultAssigned!: Node[];

    @queryAssignedNodes({slot: 'footer', flatten: true})
    footerAssigned!: Node[];

    @queryAssignedElements({slot: 'footer', flatten: true, selector: '.item'})
    footerAssignedItems!: HTMLElement[];

    override render() {
      return html`
        <slot></slot>
        <slot name="footer"></slot>
      `;
    }
  }
  customElements.define('assigned-nodes-el', D);

  class E extends RenderingElement {
    @queryAssignedNodes() defaultAssigned!: Node[];

    override render() {
      return html`
        <slot name="header"></slot>
        <slot></slot>
      `;
    }
  }
  customElements.define('assigned-nodes-el-2', E);

  const defaultSymbol = Symbol('default');

  class S extends RenderingElement {
    @queryAssignedNodes() [defaultSymbol]!: Node[];

    override render() {
      return html`
        <slot name="header"></slot>
        <slot></slot>
      `;
    }
  }
  customElements.define('assigned-nodes-el-symbol', S);

  // Note, there are 2 elements here so that the `flatten` option of
  // the decorator can be tested.
  class C extends RenderingElement {
    div!: HTMLDivElement;
    div2!: HTMLDivElement;
    div3!: HTMLDivElement;
    assignedNodesEl!: D;
    assignedNodesEl2!: E;
    assignedNodesEl3!: S;
    @queryAssignedNodes() missingSlotAssignedNodes!: Node[];

    override render() {
      return html`
        <assigned-nodes-el
          ><div id="div1">A</div>
          <slot slot="footer"></slot
        ></assigned-nodes-el>
        <assigned-nodes-el-2><div id="div2">B</div></assigned-nodes-el-2>
        <assigned-nodes-el-symbol
          ><div id="div3">B</div></assigned-nodes-el-symbol
        >
      `;
    }

    override firstUpdated() {
      this.div = this.renderRoot.querySelector('#div1') as HTMLDivElement;
      this.div2 = this.renderRoot.querySelector('#div2') as HTMLDivElement;
      this.div3 = this.renderRoot.querySelector('#div3') as HTMLDivElement;
      this.assignedNodesEl = this.renderRoot.querySelector(
        'assigned-nodes-el'
      ) as D;
      this.assignedNodesEl2 = this.renderRoot.querySelector(
        'assigned-nodes-el-2'
      ) as E;
      this.assignedNodesEl3 = this.renderRoot.querySelector(
        'assigned-nodes-el-symbol'
      ) as S;
    }
  }
  customElements.define(generateElementName(), C);

  setup(async () => {
    container = document.createElement('div');
    document.body.append(container);
    el = new C();
    container.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
  });

  teardown(() => {
    container?.remove();
  });

  test('returns assignedNodes for slot', () => {
    // Note, `defaultAssigned` does not `flatten` so we test that the property
    // reflects current state and state when nodes are added or removed.
    assert.deepEqual(el.assignedNodesEl.defaultAssigned, [
      el.div,
      el.div.nextSibling!,
    ]);
    const child = document.createElement('div');
    const text1 = document.createTextNode('');
    el.assignedNodesEl.append(text1, child);
    const text2 = document.createTextNode('');
    el.assignedNodesEl.append(text2);
    flush();
    assert.deepEqual(el.assignedNodesEl.defaultAssigned, [
      el.div,
      el.div.nextSibling!,
      text1,
      child,
      text2,
    ]);
    child.remove();
    flush();
    assert.deepEqual(el.assignedNodesEl.defaultAssigned, [
      el.div,
      el.div.nextSibling!,
      text1,
      text2,
    ]);
  });

  test('returns assignedNodes for unnamed slot that is not first slot', () => {
    assert.deepEqual(el.assignedNodesEl2.defaultAssigned, [el.div2]);
  });

  test('returns assignedNodes for unnamed slot via symbol property', () => {
    assert.deepEqual(el.assignedNodesEl3[defaultSymbol], [el.div3]);
  });

  test('returns flattened assignedNodes for slot', () => {
    // Note, `defaultAssigned` does `flatten` so we test that the property
    // reflects current state and state when nodes are added or removed to
    // the light DOM of the element containing the element under test.
    assert.deepEqual(el.assignedNodesEl.footerAssigned, []);
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    el.append(child1, child2);
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssigned, [child1, child2]);
    child2.remove();
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssigned, [child1]);
  });

  test('returns assignedNodes for slot filtered by selector', () => {
    // Note, `defaultAssigned` does `flatten` so we test that the property
    // reflects current state and state when nodes are added or removed to
    // the light DOM of the element containing the element under test.
    assert.deepEqual(el.assignedNodesEl.footerAssignedItems, []);
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    child2.classList.add('item');
    el.append(child1, child2);
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssignedItems, [child2]);
    child2.remove();
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssignedItems, []);
  });

  test('returns assignedNodes for slot that contains text nodes filtered by selector', () => {
    assert.deepEqual(el.assignedNodesEl.footerAssignedItems, []);
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    const text1 = document.createTextNode('');
    const text2 = document.createTextNode('');
    child2.classList.add('item');
    el.append(child1, text1, child2, text2);
    el.appendChild(child1);
    el.appendChild(text1);
    el.appendChild(child2);
    el.appendChild(text2);
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssignedItems, [child2]);
    el.removeChild(child2);
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssignedItems, []);
  });

  test('always returns an array, even if the slot is not rendered', () => {
    assert.isArray(el.missingSlotAssignedNodes);
  });
});
