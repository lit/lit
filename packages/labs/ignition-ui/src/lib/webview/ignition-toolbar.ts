/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import './vscode-elements.js';

@customElement('ignition-toolbar')
export class IgnitionToolbar extends LitElement {
  @property() mode: 'select' | 'interact' = 'select';

  static styles = css`
    :host {
      display: flex;
      flex-direction: row;
      gap: 8px;
      top: 8px;
      left: 8px;
      z-index: 102;
    }
    vscode-button[disabled] {
      /* No interaction, but not forbidden. */
      cursor: default;
      /* Semi-transparent doesn't look good over top of content */
      opacity: 1;
      /* Style the text color instead */
      color: var(--vscode-button-secondary-disabledForeground, #8a8a8a);
    }
  `;

  render() {
    return html`
      <vscode-button
        appearance="secondary"
        @click=${() => this.#setMode('select')}
        ?disabled=${this.mode === 'select'}
      >
        Select
      </vscode-button>
      <vscode-button
        appearance="secondary"
        @click=${() => this.#setMode('interact')}
        ?disabled=${this.mode === 'interact'}
      >
        Interact
      </vscode-button>
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
