/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a shared client/server module.
 */

import {html} from 'lit';
import {LitElement, css} from 'lit';
import {property} from 'lit/decorators/property.js';
import {Task} from '@lit/task';
import {ServerController} from '@lit-labs/ssr-client/controllers/server-controller.js';

export const initialData = {
  name: 'SSR',
  message: 'This is a test.',
  items: ['foo', 'bar', 'qux'],
  prop: 'prop-value',
  attr: 'attr-value',
  wasUpdated: false,
};

class ServerLoadedTask extends Task implements ServerController {
  get serverUpdateComplete() {
    this.run();
    return this.taskComplete;
  }
}

export class MyElement extends LitElement {
  static override styles = css`
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

  @property()
  url =
    'https://gist.githubusercontent.com/kevinpschaaf/c2baac9c299fb8912bedaafa41f0148f/raw/d23e618049da61c9405ea5464f51d07aa13f5f21/response.json';

  private fetchJson = new ServerLoadedTask(this, {
    task: async ([url], {signal}) => {
      const response = await fetch(url as string, {signal});
      return await response.json();
    },
    args: () => [this.url],
  });

  override render() {
    return html`
      <header>I'm a my-element!</header>
      <div><i>this.prop</i>: ${this.prop}</div>
      <div><i>this.attr</i>: ${this.attr}</div>

      ${this.fetchJson.render({
        pending: () => 'Loading...',
        complete: (list: unknown) =>
          html`<ul>
            ${(list as Array<{name: string}>).map(
              (item) => html`<li>${item.name}</li>`
            )}
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
