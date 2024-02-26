/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import './vscode-elements.js';
// The Chromium version in VS Code does not support the `with` keyword yet
import codiconStyles from '@vscode/codicons/dist/codicon.css' assert {type: 'css'};

// @font-face doesn't work in shadow roots! So we have to inject the styles into
// the main document.
if (!document.adoptedStyleSheets.includes(codiconStyles)) {
  document.adoptedStyleSheets.push(codiconStyles);
}

@customElement('ignition-toolbar')
export class IgnitionToolbar extends LitElement {
  @property() mode: 'select' | 'interact' = 'select';

  static styles = [
    codiconStyles,
    css`
      :host {
        display: flex;
        flex-direction: row;
        gap: 8px;
        padding: 8px;
        border-bottom: solid 1px var(--vscode-widget-border);
      }
      vscode-button[disabled] {
        /* No interaction, but not forbidden. */
        cursor: default;
      }
    `,
  ];

  render() {
    return html`
      <vscode-button
        appearance="icon"
        @click=${() => this.#setMode('select')}
        ?disabled=${this.mode === 'select'}
        ><span class="codicon codicon-inspect"></span
      ></vscode-button>
      <vscode-button
        appearance="icon"
        @click=${() => this.#setMode('interact')}
        ?disabled=${this.mode === 'interact'}
        ><span class="codicon codicon-play"></span
      ></vscode-button>
    `;
  }

  #setMode(mode: 'select' | 'interact') {
    this.mode = mode;
    this.dispatchEvent(new ModeChangeEvent(this.mode));
  }
}
export class ModeChangeEvent extends Event {
  readonly mode: 'select' | 'interact';
  constructor(mode: 'select' | 'interact') {
    super('mode-change');
    this.mode = mode;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-toolbar': IgnitionToolbar;
  }
}
