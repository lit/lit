/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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

import {html, LitElement} from '../../lit-element.js';
import {queryAssignedNodes} from '../../lib/decorators/queryAssignedNodes.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

const flush =
  window.ShadyDOM && window.ShadyDOM.flush ? window.ShadyDOM.flush : () => {};

suite('@queryAssignedNodes', () => {
  let container: HTMLElement;
  let el: C;

  class D extends LitElement {
    @queryAssignedNodes() defaultAssigned!: Node[];

    // The `true` on the decorator indicates that results should be flattened.
    @queryAssignedNodes('footer', true) footerAssigned!: Node[];

    @queryAssignedNodes('footer', true, '.item')
    footerAssignedItems!: Element[];

    render() {
      return html`
        <slot></slot>
        <slot name="footer"></slot>
      `;
    }
  }
  customElements.define('assigned-nodes-el', D);

  class E extends LitElement {
    @queryAssignedNodes() defaultAssigned!: Node[];

    @queryAssignedNodes('header') headerAssigned!: Node[];

    render() {
      return html`
        <slot name="header"></slot>
        <slot></slot>
      `;
    }
  }
  customElements.define('assigned-nodes-el-2', E);

  // Note, there are 2 elements here so that the `flatten` option of
  // the decorator can be tested.
  class C extends LitElement {
    div!: HTMLDivElement;
    div2!: HTMLDivElement;
    assignedNodesEl!: D;
    assignedNodesEl2!: E;

    render() {
      return html`
        <assigned-nodes-el
          ><div id="div1">A</div>
          <slot slot="footer"></slot
        ></assigned-nodes-el>
        <assigned-nodes-el-2><div id="div2">B</div></assigned-nodes-el-2>
      `;
    }

    firstUpdated() {
      this.div = this.renderRoot.querySelector('#div1') as HTMLDivElement;
      this.div2 = this.renderRoot.querySelector('#div2') as HTMLDivElement;
      this.assignedNodesEl = this.renderRoot.querySelector(
        'assigned-nodes-el'
      ) as D;
      this.assignedNodesEl2 = this.renderRoot.querySelector(
        'assigned-nodes-el-2'
      ) as E;
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
    await el.assignedNodesEl.updateComplete;
  });

  teardown(() => {
    if (container !== undefined) {
      container.parentElement!.removeChild(container);
      (container as any) = undefined;
    }
  });

  test('returns assignedNodes for slot', () => {
    // Note, `defaultAssigned` does not `flatten` so we test that the property
    // reflects current state and state when nodes are added or removed.
    assert.deepEqual(el.assignedNodesEl.defaultAssigned, [
      el.div,
      el.div.nextSibling!,
    ]);
    const child = document.createElement('div');
    el.assignedNodesEl.appendChild(child);
    flush();
    assert.deepEqual(el.assignedNodesEl.defaultAssigned, [
      el.div,
      el.div.nextSibling!,
      child,
    ]);
    el.assignedNodesEl.removeChild(child);
    flush();
    assert.deepEqual(el.assignedNodesEl.defaultAssigned, [
      el.div,
      el.div.nextSibling!,
    ]);
  });

  test('returns assignedNodes for unnamed slot that is not first slot', () => {
    assert.deepEqual(el.assignedNodesEl2.defaultAssigned, [el.div2]);
  });

  test('returns flattened assignedNodes for slot', () => {
    // Note, `defaultAssigned` does `flatten` so we test that the property
    // reflects current state and state when nodes are added or removed to
    // the light DOM of the element containing the element under test.
    assert.deepEqual(el.assignedNodesEl.footerAssigned, []);
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    el.appendChild(child1);
    el.appendChild(child2);
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssigned, [child1, child2]);
    el.removeChild(child2);
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
    el.appendChild(child1);
    el.appendChild(child2);
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssignedItems, [child2]);
    el.removeChild(child2);
    flush();
    assert.deepEqual(el.assignedNodesEl.footerAssignedItems, []);
  });
});
