/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import './child-element.js';

@customElement('parent-element')
export class ParentElement extends LitElement {
  override render() {
    return html`<p>Parent</p>
      <child-element></child-element>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'parent-element': ParentElement;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'parent-element':
        | React.DetailedHTMLProps<
            React.HTMLAttributes<ParentElement>,
            ParentElement
          >
        | Partial<ParentElement>;
    }
  }
}
