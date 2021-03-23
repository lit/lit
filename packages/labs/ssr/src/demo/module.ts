/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a shared client/server module.
 */

import {html, ReactiveControllerHost} from 'lit';
import {LitElement, css} from 'lit';
import {property} from 'lit/decorators/property.js';
// import {repeat} from 'lit/directives/repeat.js';
import {serverUntil} from '@lit-labs/ssr-client/directives/server-until.js';
import {ServerController} from '@lit-labs/ssr-client/controllers/server-controller.js';
import {StatusRenderer, Task} from '@lit-labs/task';

export const initialData = {
  name: 'SSR',
  message: 'This is a test.',
  items: ['foo', 'bar', 'qux'],
  prop: 'prop-value',
  attr: 'attr-value',
  wasUpdated: false,
};

const asyncContent = (content: unknown, timeout = 500) =>
  new Promise((r) => setTimeout(() => r(content), timeout));

class FetchController<T> extends Task implements ServerController {
  get serverUpdateComplete() {
    this.hostUpdated();
    return this.taskComplete;
  }
  constructor(host: ReactiveControllerHost, private url: string) {
    super(
      host,
      async ([url]: string[]) => {
        const response = await fetch(url);
        return await response.json();
      },
      () => [this.url]
    );
  }
  render(renderer: StatusRenderer<T>) {
    return super.render(renderer);
  }
}

interface DataModel {
  company: string;
}

export class MyElement extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      border: 1px dashed gray;
      margin: 4px;
      padding: 4px;
    }

    :host > * {
      padding: 4px;
    }

    header {
      font-weight: bold;
    }

    :host([wasUpdated]) {
      background: lightgreen;
    }
  `;

  @property({type: String})
  prop = 'initial-prop';
  @property({type: String})
  attr = 'initial-attr';
  @property({type: Boolean, reflect: true})
  wasUpdated = false;

  private fetchController = new FetchController<DataModel[]>(
    this,
    'https://next.json-generator.com/api/json/get/VJ_MbcMNc'
  );

  render() {
    return html`
      <header>I'm a my-element!</header>
      <div><i>this.prop</i>: ${this.prop}</div>
      <section>
        ${serverUntil(asyncContent('async content', 100), 'loading...')}
      </section>
      <div><i>this.attr</i>: ${this.attr}</div>
      ${this.fetchController.render({
        pending: () => 'Loading...',
        complete: (list) =>
          html`<ul>
            ${list.map((item) => html`<li>${item.company}</li>`)}
          </ul>`,
        error: (error: unknown) => `Error loading: ${error}`,
      })}
    `;
  }
}
customElements.define('my-element', MyElement);

export const header = (name: string) => html` <h1>Hello ${name}!</h1> `;

export const template = (data: {
  name: string;
  message: string;
  items: Array<string>;
  prop: string;
  attr: string;
  wasUpdated: boolean;
}) =>
  html`
    ${header(data.name)}
    <p>${data.message}</p>
    <h4>repeating:</h4>
    <div>${data.items.map((item, i) => html` <p>${i}) ${item}</p> `)}</div>
    ${Array(3)
      .fill(1)
      .map(
        (_item, i) => html`
          <my-element
            ?wasUpdated=${data.wasUpdated}
            .prop=${`${data.prop}: ${i}`}
            attr=${`${data.attr}: ${i}`}
          ></my-element>
        `
      )}
  `;
