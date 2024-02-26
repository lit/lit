/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

// The Chromium version in VS Code does not support the `with` keyword yet
import codiconStyles from '@vscode/codicons/dist/codicon.css' assert {type: 'css'};

// @font-face doesn't work in shadow roots! So we have to inject the styles into
// the main document.
if (!document.adoptedStyleSheets.includes(codiconStyles)) {
  document.adoptedStyleSheets.push(codiconStyles);
}

@customElement('ignition-element-palette-item')
export class IgnitionElementPaletteItem extends LitElement {
  static styles = [
    codiconStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        width: 64px;
        height: 64px;
        border-radius: 8px;
        border: solid 1px #ccc;
        padding: 4px;
        align-items: center;
        cursor: grab;
        font-size: 11px;
        box-sizing: border-box;
        user-select: none;
      }

      :host(:hover) {
        color: red;
        background-color: #222;
        border-color: currentColor;
      }

      // TODO: vertically center the icon
      #icon {
        flex: 1 1 24px;
        width: 24px;
        height: 24px;
        font: 24px / 1 codicon;
      }

      #label {
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ];

  @property()
  elementName!: string;

  @property({attribute: 'icon-name', reflect: true})
  iconName?: string;

  constructor() {
    super();
    this.addEventListener('dragstart', (e) => {
      console.log('dragstart');
      e.dataTransfer!.setData('ignition/add-element', this.elementName);
    });
  }

  render() {
    return html`
      <span id="icon" class="codicon codicon-${this.iconName ?? ''}"></span>
      <span id="label">${this.elementName}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-element-palette-item': IgnitionElementPaletteItem;
  }
}
