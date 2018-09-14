/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// Rename the html tag so that CSS linting doesn't warn on the non-standard
// @apply syntax
import {html as htmlWithApply, render} from '../../lib/shady-render.js';
import {renderShadowRoot} from '../test-utils/shadow-root.js';

const assert = chai.assert;

suite('shady-render @apply', () => {
  test('styles with css custom properties using @apply render', function() {
    const container = document.createElement('scope-5');
    document.body.appendChild(container);
    const result = htmlWithApply`
      <style>
        :host {
          --batch: {
            border: 3px solid orange;
            padding: 4px;
          };
        }
        div {
          @apply --batch;
        }
      </style>
      <div>Testing...</div>
    `;
    renderShadowRoot(result, container);
    const div = (container.shadowRoot!).querySelector('div');
    const computedStyle = getComputedStyle(div!);
    assert.equal(
        computedStyle.getPropertyValue('border-top-width').trim(), '3px');
    assert.equal(computedStyle.getPropertyValue('padding-top').trim(), '4px');
    document.body.removeChild(container);
  });

  test(
      'styles with css custom properties using @apply render in different contexts',
      async () => {
        const applyUserContent = htmlWithApply`
        <style>
          div {
            border-top: 2px solid black;
            margin-top: 4px;
            @apply --stuff;
          }
        </style>
        <div>Testing...</div>
      `;
        const applyUser = document.createElement('apply-user');
        document.body.appendChild(applyUser);
        renderShadowRoot(applyUserContent, applyUser);
        const applyUserDiv = (applyUser.shadowRoot!).querySelector('div');
        const applyUserStyle = getComputedStyle(applyUserDiv!);
        assert.equal(
            applyUserStyle.getPropertyValue('border-top-width').trim(), '2px');
        assert.equal(
            applyUserStyle.getPropertyValue('margin-top').trim(), '4px');
        // Render sub-element with a promise to ensure it's rendered after the
        // containing scope.
        const producerContent = htmlWithApply`
      <style>
        :host {
          --stuff: {
            border-top: 10px solid orange;
            padding-top: 20px;
          };
        }
      </style>
      <apply-user></apply-user>
    `;
        const applyProducer = document.createElement('apply-producer');
        document.body.appendChild(applyProducer);
        renderShadowRoot(producerContent, applyProducer);
        const userInProducer =
            applyProducer.shadowRoot!.querySelector('apply-user')!;
        renderShadowRoot(applyUserContent, userInProducer);
        const applyProducerDiv =
            userInProducer!.shadowRoot!.querySelector('div')!;
        const applyProducerStyle = getComputedStyle(applyProducerDiv!);
        assert.equal(
            applyProducerStyle.getPropertyValue('border-top-width').trim(),
            '10px');
        assert.equal(
            applyUserStyle.getPropertyValue('margin-top').trim(), '4px');
        assert.equal(
            applyProducerStyle.getPropertyValue('padding-top').trim(), '20px');
        document.body.removeChild(applyUser);
        document.body.removeChild(applyProducer);
      });
});
