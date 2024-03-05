/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {styleMap} from 'lit/directives/style-map.js';
import type {BoundingBoxWithDepth} from '../frame/iframe-api-to-webview.js';
import './ignition-toolbar.js';

declare global {
  interface HTMLElementTagNameMap {
    'ignition-stage': IgnitionStage;
  }
}

/**
 * Inspired by the prior work of `designer-stage`:
 * https://github.com/PolymerLabs/ide/blob/grid-editor/packages/editor-client/src/lib/ui/designer-stage.ts
 */
@customElement('ignition-stage')
export class IgnitionStage extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: stretch;
      box-sizing: border-box;
      position: relative;
      justify-content: center;
      outline: none;
      overflow: auto;
    }
    #content {
      width: 100%;
      display: flex;
      position: relative;
    }
    #glass {
      position: absolute;
      inset: 0;
      z-index: 101;
    }
    slot {
      border: 10px solid red;
    }
    ::slotted(*) {
      box-sizing: border-box;
    }
  `;

  @property({attribute: false})
  boxesInPageToHighlight: BoundingBoxWithDepth[] = [];

  @property({type: Boolean})
  blockInput = true;

  render() {
    return html`<div id="content">
      <slot name="mode"></slot>
      <div
        id="glass"
        style=${styleMap({display: this.blockInput ? 'none' : 'block'})}
      ></div>
      <slot name="frame"></slot>
    </div>`;
  }
}
