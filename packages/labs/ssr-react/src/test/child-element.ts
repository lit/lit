/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('child-element')
export class ChildElement extends LitElement {
  override render() {
    return html`<p>Child</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'child-element': ChildElement;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'child-element':
        | React.DetailedHTMLProps<
            React.HTMLAttributes<ChildElement>,
            ChildElement
          >
        | Partial<ChildElement>;
    }
  }
}
