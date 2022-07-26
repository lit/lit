/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import 'lit-html/polyfill-support.js';
// Rename the html tag so that CSS linting doesn't warn on the non-standard
// @apply syntax
import {html as htmlWithApply} from 'lit-html';
import {renderShadowRoot} from '../test-utils/shadow-root.js';
import {assert} from '@esm-bundle/chai';

suite('@apply', () => {
  test('styles with css custom properties using @apply render', function () {
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
    window.ShadyCSS?.styleElement(container);
    const div = container.shadowRoot!.querySelector('div');
    const computedStyle = getComputedStyle(div!);
    assert.equal(
      computedStyle.getPropertyValue('border-top-width').trim(),
      '3px'
    );
    assert.equal(computedStyle.getPropertyValue('padding-top').trim(), '4px');
    document.body.removeChild(container);
  });

  test('styles with css custom properties using @apply render in different contexts', async () => {
    const applyUserContent = htmlWithApply`
        <style>
          div {
            border-top: 2px solid black;
            margin-top: 4px;
            @apply --stuff;
          }
        </style>
        Hello
        <div>Testing...</div>
      `;

    // Test an apply user and multiple times to see that multiple stampings
    // work.
    const testApplyUser = () => {
      const applyUser = document.createElement('apply-user');
      document.body.appendChild(applyUser);
      renderShadowRoot(applyUserContent, applyUser);
      window.ShadyCSS?.styleElement(applyUser);
      const applyUserDiv = applyUser.shadowRoot!.querySelector('div');
      const applyUserStyle = getComputedStyle(applyUserDiv!);
      assert.equal(
        applyUserStyle.getPropertyValue('border-top-width').trim(),
        '2px'
      );
      assert.equal(applyUserStyle.getPropertyValue('margin-top').trim(), '4px');
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

        #test {
          color: red;
        }
      </style>
      <div id="test" ?some-attr=${true}>${'test'}</div>
      <apply-user></apply-user>
      <apply-user></apply-user>
    `;
      const applyProducer = document.createElement('apply-producer');
      document.body.appendChild(applyProducer);
      renderShadowRoot(producerContent, applyProducer);
      // Check that part values are expected.
      const div = applyProducer.shadowRoot!.querySelector('#test');
      assert.ok(div?.hasAttribute('some-attr'));
      assert.ok(div?.textContent, 'test');
      window.ShadyCSS?.styleElement(applyProducer);
      const usersInProducer =
        applyProducer.shadowRoot!.querySelectorAll('apply-user');
      renderShadowRoot(applyUserContent, usersInProducer[0]);
      window.ShadyCSS?.styleElement(usersInProducer[0] as HTMLElement);
      renderShadowRoot(applyUserContent, usersInProducer[1]);
      window.ShadyCSS?.styleElement(usersInProducer[1] as HTMLElement);
      const userInProducerStyle1 = getComputedStyle(
        usersInProducer[0].shadowRoot!.querySelector('div')!
      );
      const userInProducerStyle2 = getComputedStyle(
        usersInProducer[1].shadowRoot!.querySelector('div')!
      );
      assert.equal(
        userInProducerStyle1.getPropertyValue('border-top-width').trim(),
        '10px'
      );
      assert.equal(
        userInProducerStyle1.getPropertyValue('padding-top').trim(),
        '20px'
      );
      assert.equal(
        userInProducerStyle2.getPropertyValue('border-top-width').trim(),
        '10px'
      );
      assert.equal(
        userInProducerStyle2.getPropertyValue('padding-top').trim(),
        '20px'
      );
      document.body.removeChild(applyProducer);
    };

    // test multiple times to make sure there's no bad interaction
    testApplyProducer();
    testApplyUser();
    testApplyProducer();
  });

  test('@apply styles flow to custom elements that render in connectedCallback', () => {
    class E extends HTMLElement {
      connectedCallback() {
        const result = htmlWithApply`<style>
              div {
                border-top: 6px solid black;
                margin-top: 8px;
                @apply --stuff-ce;
              }
            </style>
            <div>Testing...</div>`;
        renderShadowRoot(result, this);
        window.ShadyCSS?.styleElement(this);
      }
    }
    customElements.define('apply-user-ce1', E);
    customElements.define('apply-user-ce2', class extends E {});

    const producerContent = htmlWithApply`
          <style>
            apply-user-ce1 {
              --stuff-ce: {
                border-top: 10px solid orange;
                padding-top: 20px;
              };
            }

            apply-user-ce2 {
              --stuff-ce: {
                border-top: 5px solid orange;
                padding-top: 10px;
              };
            }
          </style>
          <apply-user-ce1></apply-user-ce1>
          <apply-user-ce2></apply-user-ce2>
        `;
    const applyProducer = document.createElement('apply-producer-ce');
    document.body.appendChild(applyProducer);
    renderShadowRoot(producerContent, applyProducer);
    const user1 = applyProducer.shadowRoot!.querySelector('apply-user-ce1')!;
    const userInProducerStyle1 = getComputedStyle(
      user1.shadowRoot!.querySelector('div')!
    );
    const user2 = applyProducer.shadowRoot!.querySelector('apply-user-ce2')!;
    const userInProducerStyle2 = getComputedStyle(
      user2.shadowRoot!.querySelector('div')!
    );
    assert.equal(
      userInProducerStyle1.getPropertyValue('border-top-width').trim(),
      '10px'
    );
    assert.equal(
      userInProducerStyle1.getPropertyValue('padding-top').trim(),
      '20px'
    );
    assert.equal(
      userInProducerStyle2.getPropertyValue('border-top-width').trim(),
      '5px'
    );
    assert.equal(
      userInProducerStyle2.getPropertyValue('padding-top').trim(),
      '10px'
    );
    document.body.removeChild(applyProducer);
  });

  test('empty style', function () {
    const container = document.createElement('empty-style');
    document.body.appendChild(container);
    const result = htmlWithApply`
      <style></style>
      <div>Testing...</div>
    `;
    renderShadowRoot(result, container);
    window.ShadyCSS?.styleElement(container);
    document.body.removeChild(container);
  });
});
