/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ignoreBenignErrors} from '../helpers.js';
import {html, css, LitElement} from 'lit';
import {ref} from 'lit/directives/ref.js';
import {customElement, property} from 'lit/decorators.js';
import {virtualize} from '../../virtualize.js';
import {html as testingHtml, fixture} from '@open-wc/testing';

@customElement('immediate-sizing')
class ImmediateSizing extends LitElement {
  static styles = css`
    .list {
      width: 100px;
      height: 100;
    }
    .item {
      height: 50px;
      margin: 0;
      padding: 0;
    }
    .sized {
      width: 10px;
    }
  `;

  @property({type: Array, attribute: false})
  public items: Array<string> = [];

  render() {
    return html` <div class="list">
      ${virtualize({
        scroller: true,
        items: this.items,
        renderItem: (item) => html`<div class="item">[${item}]</div>`,
      })}
      <div ${ref((el?: Element) => el?.classList.toggle('sized'))}></div>
    </div>`;
  }
}

describe("Don't behave badly when sizing element before initialization is complete ", () => {
  ignoreBenignErrors(beforeEach, afterEach);

  it('should render the element without error', async () => {
    await fixture<ImmediateSizing>(
      testingHtml`
        <immediate-sizing .items=${['item 1', 'item 2']}></immediate-sizing>
      `
    );
  });
});
