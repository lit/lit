/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {expose} from './lib/comlink-endpoint-to-vscode.js';

@customElement('test-element')
export class TestElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`<p>Hello world!</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-element': TestElement;
  }
}

// acquireVsCodeApi is automatically injected when running in a VS Code webview
const vscode = acquireVsCodeApi();
{
  const initialStateString =
    document.querySelector('script#state')?.textContent;
  if (initialStateString == null) {
    throw new Error(
      'No initial state found, should have been a script tag with id "state"'
    );
  } else {
    // We only ever set the state because this is info needed to restore the
    // webview when the editor restarts.
    vscode.setState(JSON.parse(initialStateString));
  }
}

/**
 * This represents the API that's accessible from the ignition extension in
 * vscode.
 */
class ApiToExtension {
  private textContainer = (() => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    div.textContent = `Waiting to connect...`;
    return div;
  })();

  displayText(text: string) {
    this.textContainer.textContent = text;
  }
}

export type ApiExposedToExtension = ApiToExtension;
expose(vscode, new ApiToExtension());
