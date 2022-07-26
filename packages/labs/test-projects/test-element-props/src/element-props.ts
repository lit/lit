/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

export interface MyType {
  a: string;
  b: number;
  c: boolean;
  d: string[];
  e: unknown;
  strOrNum: string | number;
  optA?: string;
  optB?: number;
  optC?: boolean;
  optD?: string[];
  optE?: unknown;
  optStrOrNum?: string | number;
}

/**
 * My awesome element
 * @fires a-changed - An awesome event to fire
 */
@customElement('element-props')
export class ElementProps extends LitElement {
  @property()
  optAStr?: string;

  @property({type: Number})
  optANum?: number;

  @property({type: String})
  optAStrOrNum?: string | number;

  @property({type: Boolean})
  optABool?: boolean;

  @property({type: Array})
  optAStrArray?: string[];

  @property({type: Object, attribute: false})
  optAMyType?: MyType;

  @property()
  aStr = 'aStr';

  @property({type: Number})
  aNum = -1;

  @property({type: String})
  aStrOrNum = 'aStrOrNum';

  @property({type: Boolean})
  aBool = false;

  @property({type: Array})
  aStrArray = ['a', 'b'];

  @property({type: Object, attribute: false})
  aMyType: MyType = {
    a: 'a',
    b: -1,
    c: false,
    d: ['a', 'b'],
    e: 'isUnknown',
    strOrNum: 'strOrNum',
    optB: 100,
  };

  @state()
  aState = 'aState';

  override render() {
    return html`<h1>Props</h1>
      <div id="optAStr">${this.optAStr}</div>
      <div id="optANum">${this.optANum}</div>
      <div id="optAStrOrNum">${this.optAStrOrNum}</div>
      <div id="optABool">${this.optABool}</div>
      <div id="optAStrArray">${JSON.stringify(this.optAStrArray)}</div>
      <div id="optAMyType">${JSON.stringify(this.optAMyType)}</div>
      <div id="aStr">${this.aStr}</div>
      <div id="aNum">${this.aNum}</div>
      <div id="aStrOrNum">${this.aStrOrNum}</div>
      <div id="aBool">${this.aBool}</div>
      <div id="aStrArray">${JSON.stringify(this.aStrArray)}</div>
      <div id="aMyType">${JSON.stringify(this.aMyType)}</div>
      <div id="aState">${this.aState}</div> `;
  }
}
