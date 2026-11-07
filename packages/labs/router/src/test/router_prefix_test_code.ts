/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {Router} from '@lit-labs/router/router.js';
import {Routes} from '@lit-labs/router/routes.js';

@customElement('prefixed-router-test')
export class PrefixedRouterTest extends LitElement {
  _router = new Router(
    this,
    [
      {path: '/', render: () => html`<h2>Root</h2>`},
      {path: '/test1/:x', render: ({x}) => html`<h2>Test 1: ${x}</h2>`},
      {
        path: '/child1/*',
        render: () => html`<prefixed-child-1></prefixed-child-1>`,
      },
    ],
    {
      prefix: '/myApp',
    }
  );

  override render() {
    return html`
      <h1>Prefixed Test</h1>
      <a id="test1" href="/myApp/test1/abc">Test 1</a>
      <a id="child1" href="/myApp/child1/abc">Child 1</a>
      <a id="external" href="/anotherApp/page">External</a>
      ${this._router.outlet()}
    `;
  }
}

@customElement('prefixed-child-1')
export class PrefixedChild1 extends LitElement {
  _routes = new Routes(this, [
    {path: ':id', render: ({id}) => html`<h3>Child 1: ${id}</h3>`},
  ]);

  override render() {
    return html`
      <a id="abc" href="${this._routes.link('abc')}">ABC</a>
      ${this._routes.outlet()}
    `;
  }
}
