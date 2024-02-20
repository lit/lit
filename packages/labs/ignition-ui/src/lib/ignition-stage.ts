/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import type {ViewportBoundingBox} from './iframe-api-to-webview.js';

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

  @property({attribute: false}) boxesInPageToHighlight: ViewportBoundingBox[] =
    [];

  render() {
    return html`<div id="content">
      <div id="glass">
        ${this.boxesInPageToHighlight.map((bb) => {
          const inset = `top: ${bb.y}px; left: ${bb.x}px; height: ${bb.height}px; width: ${bb.width}px`;
          return html`<div
            style="position: absolute; ${inset}; border: 1px solid red;"
          ></div>`;
        })}
      </div>
      <slot></slot>
    </div>`;
  }
}
