/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('object-test-element')
export class ObjectTestElement extends LitElement {
  @property({type: Object})
  user = {name: 'Somebody'};

  override render() {
    return html`<p>Hello, ${this.user.name}!</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'object-test-element': ObjectTestElement;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'object-test-element':
        | React.DetailedHTMLProps<
            React.HTMLAttributes<ObjectTestElement>,
            ObjectTestElement
          >
        | Partial<ObjectTestElement>;
    }
  }
}
