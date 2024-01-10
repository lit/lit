/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {Router} from '@lit-labs/router/router.js';
import {Routes} from '@lit-labs/router/routes.js';

@customElement('router-test-1')
export class Test1 extends LitElement {
  _router = new Router(
    this,
    [
      {path: '/', render: () => html`<h2>Root</h2>`},
      {path: '/test1/:x', render: ({x}) => html`<h2>Test 1: ${x}</h2>`},
      {path: '/child1/*', render: () => html`<child-1></child-1>`},
      {path: '/child2/*', render: () => html`<child-2></child-2>`},
    ],
    {
      fallback: {
        render: (params: {[key: string]: string | undefined}) =>
          html`<h2>Not Found</h2>
            ${params[0]}`,
        enter: async (params: {[key: string]: string | undefined}) => {
          // This fallback route will asynchronously install a /server-route
          // route when the path is /server-route. This simulates checking a
          // server for a route with an API call then installing it on the client
          // if it exists.

          const path = params[0];
          if (path !== 'server-route') {
            return true;
          }

          // force the function to take a microtask
          await 0;
          const {routes} = this._router;

          // Dynamically insert a new route.
          routes.push({
            path: '/server-route',
            render: () => html`<h2>Server</h2>`,
          });

          // Make the router go again to use the newly installed route
          await this._router.goto('/' + path);

          // Tell the router to cancel the original navigation to make it
          // reentrant safe. It'll be better if we can detect reentrant calls
          // to goto() and do this automatically.
          return false;
        },
      },
    }
  );

  override render() {
    return html`
      <h1>Test</h1>
      <a id="test1" href="/test1/abc">Test 1</a>
      <a id="child1" href="/child1/abc">Child 1</a>
      <a id="child2" href="/child2/xyz">Child 2</a>
      ${this._router.outlet()}
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
      ${this._routes.outlet()}
    `;
  }
}

@customElement('child-2')
export class Child2 extends LitElement {
  _routes = new Routes(this, [
    {path: ':id', render: ({id}) => html`<h3>Child 2: ${id}</h3>`},
  ]);

  override render() {
    return this._routes.outlet();
  }
}
