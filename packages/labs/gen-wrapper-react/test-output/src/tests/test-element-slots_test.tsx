/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';

import React from 'react';
// eslint-disable-next-line import/extensions
import {render, unmountComponentAtNode} from 'react-dom';
import {ElementSlots} from '@lit-internal/test-element-a-react/element-slots.js';
import {ElementSlots as ElementSlotsElement} from '@lit-internal/test-element-a/element-slots.js';

suite('test-element-slots', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      unmountComponentAtNode(container);
      container.parentNode.removeChild(container);
    }
  });

  test('renders correctly', async () => {
    render(
      <React.StrictMode>
        <ElementSlots>
          <div slot="header" id="header1">
            Header1
          </div>
          <div slot="header" id="header2">
            Header2
          </div>
          <div slot="footer">Footer</div>
          Default
        </ElementSlots>
      </React.StrictMode>,
      container
    );
    const ce = container.querySelector('element-slots')! as ElementSlotsElement;
    await ce.updateComplete;
    const shadowRoot = ce.shadowRoot!;
    // header renders: `#header1, #header2`
    const headerSlot = shadowRoot.querySelector<HTMLSlotElement>(
      'slot[name="header"]'
    )!;
    assert.instanceOf(headerSlot, HTMLSlotElement);
    const headerAssigned = headerSlot.assignedElements();
    assert.equal(headerAssigned.length, 2);
    headerAssigned.forEach((e, i) => assert(e.id, `header${i + 1}`));
    // main renders fallback
    const mainSlot =
      shadowRoot.querySelector<HTMLSlotElement>('slot[name="main"]')!;
    const mainAssigned = mainSlot.assignedNodes({flatten: true});
    assert.equal(mainAssigned.length, 1);
    assert.equal(mainAssigned[0].textContent, `mainDefault`);
    // footer: text wrapped in div
    const footerSlot = shadowRoot.querySelector<HTMLSlotElement>(
      'slot[name="footer"]'
    )!;
    const footerAssigned = footerSlot.assignedElements();
    assert.equal(footerAssigned.length, 1);
    assert.equal(footerAssigned[0].textContent?.trim(), `Footer`);
    // default: text
    const defaultSlot =
      shadowRoot.querySelector<HTMLSlotElement>('slot:not([name])')!;
    const defaultAssigned = defaultSlot
      .assignedNodes()
      .map((e) => e.textContent?.trim())
      .filter((e) => e);
    assert.equal(defaultAssigned.length, 1);
    assert.equal(defaultAssigned[0], `Default`);
  });
});
