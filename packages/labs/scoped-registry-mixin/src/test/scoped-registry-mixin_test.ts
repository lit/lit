/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@webcomponents/scoped-custom-element-registry/scoped-custom-element-registry.min.js';
import {LitElement, html, css} from 'lit';
import {ScopedRegistryHost} from '@lit-labs/scoped-registry-mixin';
import {assert} from 'chai';

// Prevent ie11 or other incompatible browsers from running
// scoped-registry-mixin tests.
export const canTest =
  window.ShadowRoot &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  !(window as any).ShadyDOM?.inUse &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ShadowRootInit;

class SimpleGreeting extends LitElement {
  private name: String;

  static override get properties() {
    return {name: {type: String}};
  }

  constructor() {
    super();

    this.name = 'World';
  }

  override render() {
    return html`<span>hello ${this.name}!</span>`;
  }
}

class ScopedComponent extends ScopedRegistryHost(LitElement) {
  static elementDefinitions = {
    'simple-greeting': SimpleGreeting,
  };

  static override get styles() {
    return css`
      :host {
        color: #ff0000;
      }
    `;
  }

  override render() {
    return html` <simple-greeting
      id="greeting"
      name="scoped world"
    ></simple-greeting>`;
  }
}

customElements.define('scoped-component', ScopedComponent);

(canTest ? suite : suite.skip)('scoped-registry-mixin', () => {
  test(`host element should have a registry`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `<scoped-component></scoped-component>`;

    document.body.appendChild(container);

    const scopedComponent = container.firstChild as LitElement;
    await scopedComponent.updateComplete;
    // @ts-expect-error: customElements not yet in ShadowRoot type
    const registry = scopedComponent?.shadowRoot?.customElements;

    assert.exists(registry);
  });

  test(`hosted element should not have a registry`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `<scoped-component></scoped-component>`;

    document.body.appendChild(container);

    const scopedComponent = container.firstChild as LitElement;
    await scopedComponent.updateComplete;
    const simpleGreeting = scopedComponent?.shadowRoot?.getElementById(
      'greeting'
    ) as LitElement;
    // @ts-expect-error: customElements not yet in ShadowRoot type
    const registry = simpleGreeting?.shadowRoot?.customElements;

    assert.notExists(registry);
  });

  test(`hosted element should be defined inside the host element registry`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `<scoped-component></scoped-component>`;

    document.body.appendChild(container);

    const scopedComponent = container.firstChild as LitElement;
    await scopedComponent.updateComplete;
    const simpleGreeting = scopedComponent?.shadowRoot?.getElementById(
      'greeting'
    ) as LitElement;

    assert.isTrue(simpleGreeting instanceof SimpleGreeting);
  });

  test(`hosted element should not be defined in the global registry`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `<simple-greeting id="global-greeting"></simple-greeting>`;

    document.body.appendChild(container);

    const simpleGreeting = document.getElementById('global-greeting');

    assert.isFalse(simpleGreeting instanceof SimpleGreeting);
    assert.isTrue(simpleGreeting instanceof HTMLElement);
  });

  test(`host element should apply static styles`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `<scoped-component></scoped-component>`;

    document.body.appendChild(container);

    const scopedComponent = container.firstChild as LitElement;
    await scopedComponent.updateComplete;
    const simpleGreeting =
      scopedComponent?.shadowRoot?.getElementById('greeting');
    const {color} = getComputedStyle(simpleGreeting!);

    assert.equal(color, 'rgb(255, 0, 0)');
  });
});
