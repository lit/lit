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
import {html as htmlWithApply} from '../../lib/shady-render.js';
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

        // Test an apply user and multiple times to see that multiple stampings
        // work.
        const testApplyUser = () => {
          const applyUser = document.createElement('apply-user');
          document.body.appendChild(applyUser);
          renderShadowRoot(applyUserContent, applyUser);
          const applyUserDiv = (applyUser.shadowRoot!).querySelector('div');
          const applyUserStyle = getComputedStyle(applyUserDiv!);
          assert.equal(
              applyUserStyle.getPropertyValue('border-top-width').trim(),
              '2px');
          assert.equal(
              applyUserStyle.getPropertyValue('margin-top').trim(), '4px');
          document.body.removeChild(applyUser);
        };
        testApplyUser();
        testApplyUser();

        // Test an apply user inside a producer and do it multiple times to see
        // that multiple stampings work.
        const testApplyProducer = () => {
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
      <apply-user></apply-user>
    `;
          const applyProducer = document.createElement('apply-producer');
          document.body.appendChild(applyProducer);
          renderShadowRoot(producerContent, applyProducer);
          const usersInProducer =
              applyProducer.shadowRoot!.querySelectorAll('apply-user')!;
          renderShadowRoot(applyUserContent, usersInProducer[0]);
          renderShadowRoot(applyUserContent, usersInProducer[1]);
          const userInProducerStyle1 = getComputedStyle(
              usersInProducer[0]!.shadowRoot!.querySelector('div')!);
          const userInProducerStyle2 = getComputedStyle(
              usersInProducer[1]!.shadowRoot!.querySelector('div')!);
          assert.equal(
              userInProducerStyle1.getPropertyValue('border-top-width').trim(),
              '10px');
          assert.equal(
              userInProducerStyle1.getPropertyValue('padding-top').trim(),
              '20px');
          assert.equal(
              userInProducerStyle2.getPropertyValue('border-top-width').trim(),
              '10px');
          assert.equal(
              userInProducerStyle2.getPropertyValue('padding-top').trim(),
              '20px');
          document.body.removeChild(applyProducer);
        };

        // test multiple times to make sure theren's no bad interaction
        testApplyProducer();
        testApplyUser();
        testApplyProducer();
      });

  test('styles polymer-like elements with css custom properties using @apply render', function () {
    const container = document.createElement('scope-6');
    document.body.appendChild(container);

    const polymerLikeElementTagName = 'polymer-like-element';

    const polymerLikeElementTemplate = document.createElement('template');
    polymerLikeElementTemplate.innerHTML = `
      <style>
        :host {
          @apply --polymer-like;
        }
      </style>
      <div>Testing...</div>
    `;
    window.ShadyCSS.prepareTemplate(polymerLikeElementTemplate, polymerLikeElementTagName);

    class PolymerLikeElement extends HTMLElement {
      connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.appendChild(document.importNode(polymerLikeElementTemplate.content, true));
      }
    }
    window.customElements.define(polymerLikeElementTagName, PolymerLikeElement);

    const result = htmlWithApply `
      <style>
        :host {
          --polymer-like: {
            border: 3px solid orange;
            padding: 4px;
          };
        }
      </style>
      <polymer-like-element></polymer-like-element>
    `;

    renderShadowRoot(result, container);
    const pEl = (container.shadowRoot!).querySelector(polymerLikeElementTagName);
    const computedStyle = getComputedStyle(pEl!);
    assert.equal(computedStyle.getPropertyValue('border-top-width').trim(), '3px');
    assert.equal(computedStyle.getPropertyValue('padding-top').trim(), '4px');
    document.body.removeChild(container);
  });

  test('styles polymer-like elements in slots with css custom properties using @apply render', function () {
    const container = document.createElement('scope-7');
    document.body.appendChild(container);

    const polymerLikeElementTagName = 'polymer-like-element-slotted';
    const slotElementTagName = 'slot-element';

    const slotElementTemplate = document.createElement('template');
    slotElementTemplate.innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
      <slot></slot>
    `;
    window.ShadyCSS.prepareTemplate(slotElementTemplate, slotElementTagName);

    class SlotElement extends HTMLElement {
      connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.appendChild(document.importNode(slotElementTemplate.content, true));
      }
    }
    window.customElements.define(slotElementTagName, SlotElement);

    const polymerLikeElementTemplate = document.createElement('template');
    polymerLikeElementTemplate.innerHTML = `
          <style>
            :host {
              @apply --polymer-like-slot;
            }
          </style>
          <div>Testing...</div>
        `;
    window.ShadyCSS.prepareTemplate(polymerLikeElementTemplate, polymerLikeElementTagName);

    class PolymerLikeElement extends HTMLElement {
      connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.appendChild(document.importNode(polymerLikeElementTemplate.content, true));
      }
    }
    window.customElements.define(polymerLikeElementTagName, PolymerLikeElement);

    const result = htmlWithApply `
      <style>
        :host {
          --polymer-like-slot: {
            border: 3px solid orange;
            padding: 4px;
          };
        }
      </style>
      <slot-element>
        <polymer-like-element-slotted></polymer-like-element-slotted>
      </slot-element>
    `;

    renderShadowRoot(result, container);
    const pEl = (container.shadowRoot!).querySelector(polymerLikeElementTagName);
    const computedStyle = getComputedStyle(pEl!);
    assert.equal(computedStyle.getPropertyValue('border-top-width').trim(), '3px');
    assert.equal(computedStyle.getPropertyValue('padding-top').trim(), '4px');
    document.body.removeChild(container);
  });
});
