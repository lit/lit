/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {Router} from '../router.js';
import {Routes} from '../routes.js';

@customElement('router-test-1')
export class Test1 extends LitElement {
  _router = new Router(this, [
    {path: '/', render: () => html`<h2>Root</h2>`},
    {path: '/test1/:x', render: ({x}) => html`<h2>Test 1: ${x}</h2>`},
    {path: '/child1/*', render: () => html`<child-1></child-1>`},
    {path: '/child2/*', render: () => html`<child-2></child-2>`},
  ]);

  override render() {
    return html`
      <h1>Test</h1>
      <a id="test1" href="/test1/abc">Test 1</a>
      <a id="child1" href="/child1/abc">Child 1</a>
      <a id="child2" href="/child2/xyz">Child 2</a>
      ${this._router.outlet}
    `;
  }
}

@customElement('child-1')
export class Child1 extends LitElement {
  _routes = new Routes(this, [
    {path: ':id', render: ({id}) => html`<h3>Child 1: ${id}</h3>`},
  ]);

  override render() {
    return html`
      <a id="abc" href="${this._routes.link('abc')}">ABC</a>
      ${this._routes.outlet}
    `;
  }
}

@customElement('child-2')
export class Child2 extends LitElement {
  _routes = new Routes(this, [
    {path: ':id', render: ({id}) => html`<h3>Child 2: ${id}</h3>`},
  ]);

  override render() {
    return this._routes.outlet;
  }
}
