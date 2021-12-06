/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ReactiveElement,
  PropertyValues,
  ReactiveControllerHost,
} from '@lit/reactive-element';
// import {ReactiveController} from '@lit/reactive-element/reactive-controller.js';
// import {property} from '@lit/reactive-element/decorators/property.js';
import {
  MutationController,
  MutationControllerConfig,
} from '../mutation_controller';
import {generateElementName, nextFrame} from './test-helpers';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!ReactiveElement.enableWarning;

if (DEV_MODE) {
  ReactiveElement.disableWarning?.('change-in-update');
}

suite('MutationController', () => {
  let container: HTMLElement;

  interface TestElement extends ReactiveElement {
    controller: MutationController;
    controllerValue: unknown;
  }

  const defineTestElement = (
    getControllerConfig: (
      host: ReactiveControllerHost
    ) => MutationControllerConfig
  ) => {
    class A extends ReactiveElement {
      controller: MutationController;
      controllerValue: unknown;
      constructor() {
        super();
        const config = getControllerConfig(this);
        this.controller = new MutationController(this, config);
      }

      override update(props: PropertyValues) {
        super.update(props);
        this.controllerValue = this.controller.value;
      }
    }
    customElements.define(generateElementName(), A);
    return A;
  };

  const renderTestElement = async (Ctor: typeof HTMLElement) => {
    const el = new Ctor() as TestElement;
    container.appendChild(el);
    await el.updateComplete;
    return el;
  };

  const getTestElement = async (
    getControllerConfig: (
      host: ReactiveControllerHost
    ) => MutationControllerConfig
  ) => {
    const ctor = defineTestElement(getControllerConfig);
    const el = await renderTestElement(ctor);
    return el;
  };

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('can observe changes', async () => {
    const el = await getTestElement((host: ReactiveControllerHost) => ({
      target: host as unknown as HTMLElement,
      config: {attributes: true},
    }));
    assert.equal(el.controllerValue, undefined);
    el.setAttribute('hi', 'hi');
    await nextFrame();
    assert.equal(el.controllerValue, true);
    el.controller.value = undefined;
    el.requestUpdate();
    await nextFrame();
    assert.equal(el.controllerValue, undefined);
    el.setAttribute('bye', 'bye');
    await nextFrame();
    assert.equal(el.controllerValue, true);
  });

  test('observation managed via connection', async () => {
    const el = await getTestElement((host: ReactiveControllerHost) => ({
      target: host as unknown as HTMLElement,
      config: {attributes: true},
    }));
    assert.equal(el.controllerValue, undefined);
    el.remove();
    el.setAttribute('hi', 'hi');
    container.appendChild(el);
    await nextFrame();
    assert.equal(el.controllerValue, undefined);
    container.appendChild(el);
    el.setAttribute('hi', 'hi');
    await nextFrame();
    assert.equal(el.controllerValue, true);
  });

  test('can observe external element', async () => {
    const el = await getTestElement((_host: ReactiveControllerHost) => ({
      target: document.body,
      config: {childList: true},
    }));
    assert.equal(el.controllerValue, undefined);
    const d = document.createElement('div');
    document.body.appendChild(d);
    await nextFrame();
    assert.equal(el.controllerValue, true);
    el.controller.value = undefined;
    d.remove();
    await nextFrame();
    assert.equal(el.controllerValue, true);
  });

  test('can manage value', async () => {
    const el = await getTestElement((host: ReactiveControllerHost) => ({
      target: host as unknown as HTMLElement,
      config: {childList: true},
      callback: (records: MutationRecord[]) => {
        return records
          .map((r: MutationRecord) =>
            Array.from(r.addedNodes).map((n: Node) => (n as Element).localName)
          )
          .flat(Infinity);
      },
    }));
    assert.equal(el.controllerValue, undefined);
    el.appendChild(document.createElement('div'));
    await nextFrame();
    assert.sameMembers(el.controllerValue as string[], ['div']);
    el.appendChild(document.createElement('span'));
    await nextFrame();
    assert.sameMembers(el.controllerValue as string[], ['span']);
  });
});
