/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Context, provide} from '@lit/context';
import {assert} from 'chai';
import {LitElement, html} from 'lit';

const simpleContext = 'simple-context' as Context<'simple-context', number>;

test('@provide before @property', async () => {
  class AccessorProvider extends LitElement {
    @provide({context: simpleContext})
    accessor value = 7;

    override render() {
      return html`
        <span>${this.value}</span>
        <simple-consumer></simple-consumer>
      `;
    }
  }
  customElements.define('accessor-provider', AccessorProvider);

  const provider = document.createElement(
    'accessor-provider'
  ) as AccessorProvider;
  document.body.appendChild(provider);
  // The field's value is written with its initial value.
  assert.equal(provider.value, 7);
});
