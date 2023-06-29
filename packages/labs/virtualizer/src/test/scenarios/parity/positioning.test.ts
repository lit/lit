/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  array,
  getVisibleElementDetails,
  ignoreBenignErrors,
  until,
} from '../../helpers.js';
import {virtualize} from '../../../virtualize.js';
import {repeat} from 'lit/directives/repeat.js';
import {expect, fixture, html} from '@open-wc/testing';
import {html as html_, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('my-example')
class MyExample extends LitElement {
  static styles = css`
    div {
      display: block;
      margin: 0;
      padding: 0;
    }
    :host,
    .viewport {
      height: 500px;
      width: 500px;
      overflow: scroll;
    }
    .item {
      height: 50px;
      width: 300px;
      overflow: hidden;
    }
  `;

  @property({type: Boolean}) virtual = false;
  @property({type: Array}) items = array(10);

  renderItem(i: number) {
    return html`<div class="item">ITEM "${i}"</div>`;
  }

  get viewport() {
    return this.shadowRoot!.querySelector('.viewport')!;
  }

  get container() {
    return this.shadowRoot!.querySelector('.container')!;
  }

  override render() {
    return html_`
      <div class="viewport">
        <div class="container">
          ${
            this.virtual
              ? virtualize({items: this.items, renderItem: this.renderItem})
              : repeat(this.items, this.renderItem)
          }
          <div>
        </div>
      `;
  }
}

describe('A simple collection of 100 items with 10 visible', () => {
  ignoreBenignErrors(beforeEach, afterEach);

  function visibleText(container: Element): string {
    return getVisibleElementDetails(container)
      .map((item) => item.textContent)
      .filter((text): text is string => text != null)
      .join();
  }

  it('renders visually equivalent in virtual and non-virtual', async () => {
    const getNormalContents = () => getVisibleElementDetails(normal.container);
    const getVirtualContents = () =>
      getVisibleElementDetails(virtual.container);

    const items = array(10);

    const normal = (await fixture(
      html`<my-example .items=${items}></my-example>`
    )) as MyExample;
    const virtual = (await fixture(
      html`<my-example .items=${items} virtual></my-example>`
    )) as MyExample;

    await until(
      () => normal instanceof MyExample && virtual instanceof MyExample
    );
    await until(() =>
      expect(
        normal.container.querySelectorAll('.item').length
      ).to.be.greaterThanOrEqual(10)
    );

    await until(() =>
      expect(
        virtual.container.querySelectorAll('.item').length
      ).to.be.greaterThanOrEqual(10)
    );
    await until(() =>
      expect(getNormalContents()).to.deep.equal(getVirtualContents())
    );

    normal.items = array(100);
    virtual.items = array(100);

    await until(() =>
      expect(
        normal.container.querySelectorAll('.item').length
      ).to.be.greaterThanOrEqual(100)
    );
    await until(() =>
      expect(
        virtual.container.querySelectorAll('.item').length
      ).to.be.greaterThanOrEqual(10)
    );

    await until(() =>
      expect(getNormalContents()).to.deep.equal(getVirtualContents())
    );

    normal.viewport.scrollBy({top: 1000});
    virtual.viewport.scrollBy({top: 1000});

    await until(() =>
      expect(visibleText(normal.container)).to.include('ITEM "20"')
    );
    await until(() =>
      expect(visibleText(virtual.container)).to.include('ITEM "20"')
    );

    await until(() =>
      expect(getNormalContents()).to.deep.equal(getVirtualContents())
    );
  });
});
