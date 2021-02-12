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
import '@webcomponents/scoped-custom-element-registry/packages/scoped-custom-element-registry/scoped-custom-element-registry.js';
import {LitElement, html} from 'lit';
import {UseScopedRegistry} from '../scoped-registry-mixin';
import {assert} from '@esm-bundle/chai';

class SimpleGreeting extends UseScopedRegistry(LitElement) {
  private name: String;

  static get properties() {
    return {name: {type: String}};
  }

  constructor() {
    super();

    this.name = 'World';
  }

  render() {
    return html`<span>hello ${this.name}!</span>`;
  }
}

class ScopedComponent extends UseScopedRegistry(LitElement) {
  static scopedElements = {
    'simple-greeting': SimpleGreeting,
  };

  render() {
    return html` <simple-greeting
      id="greeting"
      name="scoped world"
    ></simple-greeting>`;
  }
}

customElements.define('scoped-component', ScopedComponent);

suite('scoped-registry-mixin', () => {
  test(`scoped-component should have a registry`, async () => {
    const $container = document.createElement('div');
    $container.innerHTML = `<scoped-component></scoped-component>`;

    document.body.appendChild($container);

    const $scopedComponent = $container.firstChild as LitElement;
    await $scopedComponent.updateComplete;
    // @ts-expect-error: customElements not yet in ShadowRoot type
    const registry = $scopedComponent?.shadowRoot?.customElements;

    assert.exists(registry);
  });

  test(`simple-greeting should not have a registry`, async () => {
    const $container = document.createElement('div');
    $container.innerHTML = `<scoped-component></scoped-component>`;

    document.body.appendChild($container);

    const $scopedComponent = $container.firstChild as LitElement;
    await $scopedComponent.updateComplete;
    const $simpleGreeting = $scopedComponent?.shadowRoot?.getElementById(
      'greeting'
    ) as LitElement;
    // @ts-expect-error: customElements not yet in ShadowRoot type
    const registry = $simpleGreeting?.shadowRoot?.customElements;

    assert.notExists(registry);
  });

  test(`simple-greeting should be defined inside the ScopedComponent registry`, async () => {
    const $container = document.createElement('div');
    $container.innerHTML = `<scoped-component></scoped-component>`;

    document.body.appendChild($container);

    const $scopedComponent = $container.firstChild as LitElement;
    await $scopedComponent.updateComplete;
    const $simpleGreeting = $scopedComponent?.shadowRoot?.getElementById(
      'greeting'
    ) as LitElement;

    assert.isTrue($simpleGreeting instanceof SimpleGreeting);
  });

  test(`simple-greeting should not be able in the global registry`, async () => {
    const $container = document.createElement('div');
    $container.innerHTML = `<simple-greeting id="global-greeting"></simple-greeting>`;

    document.body.appendChild($container);

    const $simpleGreeting = document.getElementById('global-greeting');

    assert.isFalse($simpleGreeting instanceof SimpleGreeting);
    assert.isTrue($simpleGreeting instanceof HTMLElement);
  });
});
