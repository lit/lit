/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';

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
  render() {
    return html`<div id="content">
      <div id="glass"></div>
      <slot></slot>
    </div>`;
  }
}
