/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('test-element')
export class TestElement extends LitElement {
  static override styles = css`
    p {
      color: blue;
    }
  `;

  @property()
  name = 'Somebody';

  override render() {
    return html`<p>Hello, ${this.name}!</p>
      <slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-element': TestElement;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'test-element':
        | React.DetailedHTMLProps<
            React.HTMLAttributes<TestElement>,
            TestElement
          >
        | Partial<TestElement>;
    }
  }
}
