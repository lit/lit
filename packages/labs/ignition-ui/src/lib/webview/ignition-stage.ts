/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import './ignition-toolbar.js';
import {LitElement, html, css, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import type {BoundingBoxWithDepth} from '../frame/iframe-api-to-webview.js';

declare global {
  interface HTMLElementTagNameMap {
    'ignition-stage': IgnitionStage;
  }
}

const colors = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#800080',
  '#da6ab8',
  '#00ffff',
];

/**
 * Inspired by the prior work of `designer-stage`:
 * https://github.com/PolymerLabs/ide/blob/grid-editor/packages/editor-client/src/lib/ui/designer-stage.ts
 */
@customElement('ignition-stage')
class IgnitionStage extends LitElement {
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
    let glass: unknown = nothing;
    if (this.blockInput) {
      glass = html`<div id="glass">
        ${this.boxesInPageToHighlight.map((bbd) => {
          const bb = bbd.boundingBox;
          const inset = `top: ${bb.y}px; left: ${bb.x}px; height: ${bb.height}px; width: ${bb.width}px`;
          const color = colors[bbd.depth % colors.length];
          return html`<div
            style="position: absolute; ${inset}; border: 1px solid ${color};"
          ></div>`;
        })}
      </div>`;
    }
    return html`<div id="content">
      ${glass}
      <slot></slot>
    </div>`;
  }
}
