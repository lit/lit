/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@webcomponents/scoped-custom-element-registry/scoped-custom-element-registry.min.js';
import {LitElement, html, css} from 'lit';
import {
  ScopedRegistryHost,
  ElementDefinitionsMap,
} from '@lit-labs/scoped-registry-mixin';
import {assert} from 'chai';

// Prevent ie11 or other incompatible browsers from running
// scoped-registry-mixin tests.
export const canTest =
  window.ShadowRoot &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  !(window as any).ShadyDOM?.inUse;

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
  } as ElementDefinitionsMap;

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

  test(`elements should have same registry`, async () => {
    const container = document.createElement('div');
    container.innerHTML = `<scoped-component></scoped-component><scoped-component></scoped-component>`;

    document.body.appendChild(container);

    const [scopedComponent1, scopedComponent2] = Array.from(
      container.children
    ) as LitElement[];
    await scopedComponent1.updateComplete;
    await scopedComponent2.updateComplete;
    // @ts-expect-error: customElements not yet in ShadowRoot type
    const registry1 = scopedComponent1?.shadowRoot?.customElements;
    // @ts-expect-error: customElements not yet in ShadowRoot type
    const registry2 = scopedComponent2?.shadowRoot?.customElements;

    assert.equal(registry1, registry2);
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

  test(`subclass can define additional elements in own registry`, async () => {
    class SubScopedComponent extends ScopedRegistryHost(ScopedComponent) {
      static override elementDefinitions = {
        'another-greeting': class extends SimpleGreeting {},
      };

      override render() {
        return html`
          ${super.render()}
          <another-greeting id="another" name="again"></another-greeting>
        `;
      }
    }
    customElements.define('sub-scoped-component', SubScopedComponent);

    const container = document.createElement('div');
    container.innerHTML = `
      <scoped-component></scoped-component>
      <sub-scoped-component></sub-scoped-component>`;

    document.body.appendChild(container);

    const [scopedComponent, subScopedComponent] = Array.from(
      container.children
    ) as LitElement[];
    await scopedComponent.updateComplete;
    await subScopedComponent.updateComplete;
    // @ts-expect-error: customElements not yet in ShadowRoot type
    const registry1 = scopedComponent?.shadowRoot?.customElements;
    // @ts-expect-error: customElements not yet in ShadowRoot type
    const registry2 = subScopedComponent?.shadowRoot?.customElements;

    assert.notEqual(registry1, registry2);

    assert.isUndefined(registry1?.get('another-greeting'));
    assert.isDefined(registry2?.get('another-greeting'));

    const simpleGreeting = subScopedComponent?.shadowRoot?.getElementById(
      'greeting'
    ) as LitElement;

    assert.isTrue(simpleGreeting instanceof SimpleGreeting);
    const anotherGreeting = subScopedComponent?.shadowRoot?.getElementById(
      'another'
    ) as LitElement;

    assert.isTrue(simpleGreeting instanceof SimpleGreeting);
    assert.isTrue(anotherGreeting instanceof SimpleGreeting);
  });
});
