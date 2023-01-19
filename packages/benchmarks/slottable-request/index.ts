/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, css, LitElement, render} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';

import {requestSlottable} from '@lit-labs/slottable-request/request-slottable.js';
import {renderSlottable} from '@lit-labs/slottable-request/render-slottable.js';

import {queryParams} from '../utils/query-params.js';
import {SlottableRequestEvent, remove} from '@lit-labs/slottable-request';

type Approach =
  | 'render-prop'
  | 'static-slotted'
  | 'slottable-request'
  | 'slottable-request-directive';

const {
  elCount = 1,
  listCount = 20,
  updateCount = 0,
  approach = 'slottable-request-directive',
  mods = '',
} = queryParams as {
  elCount: number;
  listCount: number;
  updateCount: number;
  approach: Approach;
  mods: string;
};

interface Item {
  id: number;
  text: string;
}

@customElement('slottable-requestor')
export class SlottableRequestor extends LitElement {
  @property()
  updateid = 0;

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 200px;
    }
    .header {
      color: white;
    }
    .body {
      flex: 1;
    }
    .item {
      padding: 2px;
      margin: 2px;
      border: 1px solid red;
    }
  `;

  protected override render() {
    const items = new Array(listCount)
      .fill(0)
      .map((_, i) => ({id: i, text: `[Item ${i} - ${this.updateid}]`}));
    this.dispatchEvent(
      new SlottableRequestEvent(
        'header',
        `[This is the header - ${this.updateid}]`
      )
    );
    items.forEach((item: Item) =>
      this.dispatchEvent(
        new SlottableRequestEvent('item', item, String(item.id))
      )
    );
    return html`
      <div class="header"><slot name="header"></slot></div>
      <div class="body">
        ${items.map(
          (item: Item) => html`
            <div class="item"><slot name="item.${item.id}"></slot></div>
          `
        )}
      </div>
    `;
  }
}

@customElement('slottable-renderer')
export class SlottableRenderer extends LitElement {
  @property()
  updateid = 0;

  static override styles = css`
    :host {
      display: block;
      border: 1px solid blue;
      margin: 5px;
      padding: 5px;
    }
    h2 {
      background: blue;
    }
    .slotted-item {
      padding: 2px;
      margin: 2px;
      border: 1px solid green;
    }
  `;

  protected override render() {
    return html`
      <slottable-requestor
        .updateid=${this.updateid}
        @slottable-request=${this.onSlottableRequest}
      >
        ${repeat(
          this.slottables,
          ([key]) => key,
          ([_, r]) => r
        )}
      </slottable-requestor>
    `;
  }

  slottables = new Map<string, unknown>();
  onSlottableRequest(
    request:
      | SlottableRequestEvent<'header', string>
      | SlottableRequestEvent<'item', Item>
  ) {
    if (request.data === remove) {
      this.slottables.delete(request.slotName);
    } else {
      this.slottables.set(
        request.slotName,
        request.name === 'header'
          ? html`<h2 slot="header">${request.data} - ${this.updateid}</h2>`
          : html`<div
              slot="item.${(request.data as Item).id}"
              class="slotted-item"
            >
              ${(request.data as Item).text} - ${this.updateid}
            </div>`
      );
    }
    this.requestUpdate();
  }
}

@customElement('slottable-requestor-directive')
export class SlottableRequestorDirective extends LitElement {
  @property()
  updateid = 0;

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 200px;
    }
    .header {
      color: white;
    }
    .body {
      flex: 1;
    }
    .item {
      padding: 2px;
      margin: 2px;
      border: 1px solid red;
    }
  `;

  protected override render() {
    const items = new Array(listCount)
      .fill(0)
      .map((_, i) => ({id: i, text: `[Item ${i} - ${this.updateid}]`}));
    return html`
      <div class="header">
        ${requestSlottable('header', `[This is the header - ${this.updateid}]`)}
      </div>
      <div class="body">
        ${repeat(
          items,
          (item: Item) => item.id,
          (item: Item) => html`
            <div class="item">${requestSlottable('item', item, item.id)}</div>
          `
        )}
      </div>
    `;
  }
}

@customElement('slottable-renderer-directive')
export class SlottableRendererDirective extends LitElement {
  @property()
  updateid = 0;

  static override styles = css`
    :host {
      display: block;
      border: 1px solid blue;
      margin: 5px;
      padding: 5px;
    }
    h2 {
      background: blue;
    }
    .slotted-item {
      padding: 2px;
      margin: 2px;
      border: 1px solid green;
    }
  `;

  protected override render() {
    return html`
      <slottable-requestor-directive .updateid=${this.updateid}>
        ${renderSlottable<{header: string; item: Item}>({
          header: (text: string) => html`<h2>${text} - ${this.updateid}</h2>`,
          item: (item: Item) =>
            html`<div class="slotted-item">
              ${item.text} - ${this.updateid}
            </div>`,
        })}
      </slottable-requestor-directive>
    `;
  }
}

@customElement('static-slotted-requestor')
export class StaticSlottedRequestor extends LitElement {
  @property()
  updateid = 0;

  @property()
  items!: Item[];

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 200px;
    }
    .header {
      color: white;
    }
    .body {
      flex: 1;
    }
    .item {
      padding: 2px;
      margin: 2px;
      border: 1px solid red;
    }
  `;

  protected override render() {
    return html`
      <div class="header">
        <slot name="header"></slot>
      </div>
      <div class="body">
        ${repeat(
          this.items,
          (item: Item) => html`
            <div class="item"><slot name="${`item-${item.id}`}"></slot>></div>
          `
        )}
      </div>
    `;
  }
}

@customElement('static-slotted-renderer')
export class StaticSlottedRenderer extends LitElement {
  @property()
  updateid = 0;

  static override styles = css`
    :host {
      display: block;
      border: 1px solid blue;
      margin: 5px;
      padding: 5px;
    }
    h2 {
      background: blue;
    }
    .slotted-item {
      padding: 2px;
      margin: 2px;
      border: 1px solid green;
    }
  `;

  protected override render() {
    const items = new Array(listCount)
      .fill(0)
      .map((_, i) => ({id: i, text: `[Item ${i} - ${this.updateid}]`}));
    const template =
      mods === 'no-wrapper'
        ? (item: Item) =>
            html`<div class="slotted-item" slot="${`item.${item.id}`}">
              ${item.text} - ${this.updateid}
            </div>`
        : (item: Item) =>
            html`<div style="display: contents;" slot="${`item.${item.id}`}">
              <div class="slotted-item">${item.text} - ${this.updateid}</div>
            </div>`;
    return html`
      <static-slotted-requestor .updateid=${this.updateid} .items=${items}>
        <h2 slot="header">
          [This is the header - ${this.updateid}] - ${this.updateid}
        </h2>
        ${repeat(items, (item: Item) => item.id, template)}
      </static-slotted-requestor>
    `;
  }
}

@customElement('render-prop-renderer')
export class RenderPropRenderer extends LitElement {
  @property()
  updateid = 0;

  static override styles = css`
    :host {
      display: block;
      border: 1px solid blue;
      margin: 5px;
      padding: 5px;
    }
  `;

  protected override render() {
    return html`
      <render-prop-requestor
        .updateid=${this.updateid}
        .headerTemplate=${(text: string) =>
          html`<h2>${text} - ${this.updateid}</h2>`}
        .itemTemplate=${(item: Item) =>
          html`<div class="slotted-item">${item.text} - ${this.updateid}</div>`}
      >
      </render-prop-requestor>
    `;
  }
}

@customElement('render-prop-requestor')
export class RenderPropRequestor extends LitElement {
  @property()
  updateid = 0;

  @property()
  headerTemplate!: (text: string, updateId: number) => unknown;

  @property()
  itemTemplate!: (item: Item, updateId: number) => unknown;

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 200px;
    }
    .header {
      color: white;
    }
    .body {
      flex: 1;
    }
    .item {
      padding: 2px;
      margin: 2px;
      border: 1px solid red;
    }
    /* Render prop styles */
    h2 {
      background: blue;
    }
    .slotted-item {
      padding: 2px;
      margin: 2px;
      border: 1px solid green;
    }
  `;

  protected override render() {
    const items = new Array(listCount)
      .fill(0)
      .map((_, i) => ({id: i, text: `[Item ${i} - ${this.updateid}]`}));
    const header =
      mods === 'slot-fallback'
        ? html`<slot name="header"
            >${this.headerTemplate(
              `[This is the header - ${this.updateid}]`,
              this.updateid
            )}</slot
          >`
        : this.headerTemplate(
            `[This is the header - ${this.updateid}]`,
            this.updateid
          );
    const itemTemplate =
      mods === 'slot-fallback'
        ? (item: Item) => html`
            <slot name="item.${item.id}"
              ><div class="item">
                ${this.itemTemplate(item, this.updateid)}
              </div></slot
            >
          `
        : (item: Item) => html`
            <div class="item">${this.itemTemplate(item, this.updateid)}</div>
          `;
    return html`
      <div class="header">${header}</div>
      <div class="body">${repeat(items, itemTemplate)}</div>
    `;
  }
}

const elCountArr = new Array(elCount).fill(0);
const {body} = document;
const templates: {[p in Approach]: (n: number) => unknown} = {
  'slottable-request-directive': (updateId: number) =>
    html`<slottable-renderer-directive
      .updateid=${updateId}
    ></slottable-renderer-directive>`,
  'slottable-request': (updateId: number) =>
    html`<slottable-renderer .updateid=${updateId}></slottable-renderer>`,
  'static-slotted': (updateId: number) =>
    html`<static-slotted-renderer
      .updateid=${updateId}
    ></static-slotted-renderer>`,
  'render-prop': (updateId: number) =>
    html`<render-prop-renderer .updateid=${updateId}></render-prop-renderer>`,
};

(async () => {
  // wait until after page loads
  if (document.readyState !== 'complete') {
    let resolve: () => void;
    const p = new Promise<void>((r) => (resolve = r));
    document.addEventListener('readystatechange', async () => {
      if (document.readyState === 'complete') {
        resolve();
      }
    });
    await p;
  }
  await new Promise((r) => setTimeout(r));

  performance.mark('render-start');
  for (let updateId = 0; updateId < updateCount + 1; updateId++) {
    const els = elCountArr.map(() => templates[approach](updateId));
    render(els, body);
  }
  await new Promise((r) => requestAnimationFrame(r));
  performance.measure('render', 'render-start');

  performance
    .getEntriesByType('measure')
    .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
})();
