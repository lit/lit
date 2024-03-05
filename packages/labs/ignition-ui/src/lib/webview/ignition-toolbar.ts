/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
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
  @property() selectionMode: 'select' | 'interact' = 'select';

  @property({type: Boolean}) autoChangeStoryUrl = true;

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
        aria-label="Select Mode"
        appearance="icon"
        @click=${() => this.#setMode('select')}
        ?disabled=${this.selectionMode === 'select'}
        ><span class="codicon codicon-inspect"></span
      ></vscode-button>
      <vscode-button
        aria-label="Interact Mode"
        appearance="icon"
        @click=${() => this.#setMode('interact')}
        ?disabled=${this.selectionMode === 'interact'}
        ><span class="codicon codicon-play"></span
      ></vscode-button>
      <vscode-button
        aria-label="${this.autoChangeStoryUrl
          ? 'Displayed stories change automatically as you navigate. Click to lock.'
          : 'Locked to current change, click to unlock and automatically update displayed story.'}"
        appearance="icon"
        @click=${() => this.#setAutoChangeStoryUrl(!this.autoChangeStoryUrl)}
        ><span
          class="codicon codicon-${this.autoChangeStoryUrl ? 'unlock' : 'lock'}"
        ></span
      ></vscode-button>
      <vscode-button
        aria-label="Reload"
        appearance="icon"
        @click=${() => this.dispatchEvent(new ReloadFrameEvent())}
        ><span class="codicon codicon-refresh"></span
      ></vscode-button>
    `;
  }

  #setMode(mode: 'select' | 'interact') {
    this.selectionMode = mode;
    this.dispatchEvent(new SelectionModeChangeEvent(this.selectionMode));
  }

  #setAutoChangeStoryUrl(locked: boolean) {
    this.autoChangeStoryUrl = locked;
    this.dispatchEvent(
      new AutoChangeStoryUrlChangeEvent(this.autoChangeStoryUrl)
    );
  }
}
export class SelectionModeChangeEvent extends Event {
  readonly mode: 'select' | 'interact';
  constructor(mode: 'select' | 'interact') {
    super('selection-mode-change');
    this.mode = mode;
  }
}

export class AutoChangeStoryUrlChangeEvent extends Event {
  readonly locked: boolean;
  constructor(locked: boolean) {
    super('auto-change-story-url-change');
    this.locked = locked;
  }
}

export class ReloadFrameEvent extends Event {
  constructor() {
    super('reload-frame');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-toolbar': IgnitionToolbar;
  }
}
