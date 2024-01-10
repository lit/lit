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
import {
  MutationController,
  MutationControllerConfig,
  MutationValueCallback,
} from '@lit-labs/observers/mutation-controller.js';
import {generateElementName, nextFrame} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!ReactiveElement.enableWarning;

if (DEV_MODE) {
  ReactiveElement.disableWarning?.('change-in-update');
}

// Run tests if MutationObserver and ShadowRoot is present. ShadowRoot test
// prevents consistent ie11 failures.
const canTest =
  window.MutationObserver &&
  window.ShadowRoot &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  !(window as any).ShadyDOM?.inUse;
(canTest ? suite : suite.skip)('MutationController', () => {
  let container: HTMLElement;

  interface TestElement extends ReactiveElement {
    observer: MutationController;
    observerValue: unknown;
    resetObserverValue: () => void;
    changeDuringUpdate?: () => void;
  }

  const defineTestElement = (
    getControllerConfig: (
      host: ReactiveControllerHost
    ) => MutationControllerConfig
  ) => {
    class A extends ReactiveElement {
      observer: MutationController;
      observerValue: unknown;
      changeDuringUpdate?: () => void;
      constructor() {
        super();
        const config = getControllerConfig(this);
        this.observer = new MutationController(this, {
          callback: () => true,
          ...config,
        });
      }

      override update(props: PropertyValues) {
        super.update(props);
        if (this.changeDuringUpdate) {
          this.changeDuringUpdate();
        }
      }

      override updated() {
        this.observerValue = this.observer.value;
      }

      resetObserverValue() {
        this.observer.value = this.observerValue = undefined;
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
    const el = await getTestElement(() => ({
      config: {attributes: true},
    }));

    // Reports initial change by default
    assert.isTrue(el.observerValue);

    // Reports attribute change
    el.resetObserverValue();
    el.setAttribute('hi', 'hi');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports another attribute change
    el.resetObserverValue();
    el.requestUpdate();
    await nextFrame();
    assert.isUndefined(el.observerValue);
    el.setAttribute('bye', 'bye');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('can observe changes during update', async () => {
    const el = await getTestElement(() => ({
      config: {attributes: true},
    }));
    el.resetObserverValue();
    el.changeDuringUpdate = () => el.setAttribute('hi', 'hi');
    el.requestUpdate();
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('skips initial changes when `skipInitial` is `true`', async () => {
    const el = await getTestElement((host: ReactiveControllerHost) => ({
      target: host as unknown as HTMLElement,
      config: {attributes: true},
      skipInitial: true,
    }));

    // Does not reports initial change when `skipInitial` is set
    assert.isUndefined(el.observerValue);

    // Reports subsequent attribute change when `skipInitial` is set
    el.resetObserverValue();
    el.setAttribute('hi', 'hi');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports another attribute change
    el.resetObserverValue();
    el.requestUpdate();
    await nextFrame();
    assert.isUndefined(el.observerValue);
    el.setAttribute('bye', 'bye');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('observation managed via connection', async () => {
    const el = await getTestElement(() => ({
      config: {attributes: true},
      skipInitial: true,
    }));
    assert.isUndefined(el.observerValue);

    // Does not report change after element removed.
    el.remove();
    el.setAttribute('hi', 'hi');

    // Reports no change after element re-connected.
    container.appendChild(el);
    await nextFrame();
    assert.isUndefined(el.observerValue);

    // Reports change on mutation when element is connected
    el.setAttribute('hi', 'hi');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('can observe external element', async () => {
    const el = await getTestElement(() => ({
      target: document.body,
      config: {childList: true},
      skipInitial: true,
    }));
    assert.equal(el.observerValue, undefined);
    const d = document.createElement('div');
    document.body.appendChild(d);
    await nextFrame();
    assert.isTrue(el.observerValue);
    el.resetObserverValue();
    d.remove();
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('can manage value via `callback`', async () => {
    const el = await getTestElement(() => ({
      config: {childList: true},
      callback: (records: MutationRecord[]) => {
        return records
          .map((r: MutationRecord) =>
            Array.from(r.addedNodes).map((n: Node) => (n as Element).localName)
          )
          .flat(Infinity);
      },
    }));
    el.appendChild(document.createElement('div'));
    await nextFrame();
    assert.sameMembers(el.observerValue as string[], ['div']);
    el.appendChild(document.createElement('span'));
    await nextFrame();
    assert.sameMembers(el.observerValue as string[], ['span']);
  });

  test('can call `observe` to observe element', async () => {
    const el = await getTestElement(() => ({
      config: {attributes: true},
    }));
    el.resetObserverValue();
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.appendChild(d1);
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to observed target.
    el.resetObserverValue();
    d1.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to configured target.
    el.resetObserverValue();
    el.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Can observe another target
    el.resetObserverValue();
    const d2 = document.createElement('div');
    el.observer.observe(d2);
    el.appendChild(d2);
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to new observed target.
    el.resetObserverValue();
    d2.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to configured target.
    el.resetObserverValue();
    el.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to first observed target.
    el.resetObserverValue();
    d1.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('can specifying target as `null` and call `observe` to observe element', async () => {
    const el = await getTestElement(() => ({
      target: null,
      config: {attributes: true},
    }));
    el.resetObserverValue();
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.appendChild(d1);
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to observed target.
    el.resetObserverValue();
    d1.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Can observe another target
    el.resetObserverValue();
    const d2 = document.createElement('div');
    el.observer.observe(d2);
    el.appendChild(d2);
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to new observed target.
    el.resetObserverValue();
    d2.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to first observed target.
    el.resetObserverValue();
    d1.setAttribute('a', 'a1');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('observed targets are re-observed on host connected', async () => {
    const el = await getTestElement(() => ({
      target: null,
      config: {attributes: true},
    }));
    el.resetObserverValue();
    const d1 = document.createElement('div');
    const d2 = document.createElement('div');

    el.observer.observe(d1);
    el.observer.observe(d2);

    await nextFrame();
    el.remove();

    container.appendChild(el);

    // Reports change to first observed target.
    el.resetObserverValue();
    d1.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports change to second observed target.
    el.resetObserverValue();
    d2.setAttribute('a', 'a1');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('observed target respects `skipInitial`', async () => {
    const el = await getTestElement(() => ({
      target: null,
      config: {attributes: true},
      skipInitial: true,
    }));
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.appendChild(d1);
    await nextFrame();
    assert.isUndefined(el.observerValue);

    // Reports change to observed target.
    d1.setAttribute('a', 'a');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('observed target re-observed on connection', async () => {
    const el = await getTestElement(() => ({
      target: null,
      config: {attributes: true},
    }));
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.appendChild(d1);
    await nextFrame();
    assert.isTrue(el.observerValue);
    el.resetObserverValue();
    await nextFrame();
    el.remove();

    // Does not reports change when disconnected.
    d1.setAttribute('a', 'a');
    await nextFrame();
    assert.isUndefined(el.observerValue);

    // Does report change when re-connected
    container.appendChild(el);
    d1.setAttribute('a', 'a1');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Can re-observe after connection.
    el.resetObserverValue();
    el.observer.observe(d1);
    d1.setAttribute('a', 'a2');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('can observe changes when initialized after host connected', async () => {
    class TestFirstUpdated extends ReactiveElement {
      observer!: MutationController<true>;
      observerValue: true | undefined = undefined;
      override firstUpdated() {
        this.observer = new MutationController(this, {
          config: {attributes: true},
          callback: () => true,
        });
      }
      override updated() {
        this.observerValue = this.observer.value;
      }
      resetObserverValue() {
        this.observer.value = this.observerValue = undefined;
      }
    }
    customElements.define(generateElementName(), TestFirstUpdated);

    const el = (await renderTestElement(TestFirstUpdated)) as TestFirstUpdated;

    // Reports initial change by default
    assert.isTrue(el.observerValue);

    // Reports attribute change
    el.resetObserverValue();
    el.setAttribute('hi', 'hi');
    await nextFrame();
    assert.isTrue(el.observerValue);

    // Reports another attribute change
    el.resetObserverValue();
    el.requestUpdate();
    await nextFrame();
    assert.isUndefined(el.observerValue);
    el.setAttribute('bye', 'bye');
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('can observe external element after host connected', async () => {
    class A extends ReactiveElement {
      observer!: MutationController<true>;
      observerValue: true | undefined = undefined;
      override firstUpdated() {
        this.observer = new MutationController(this, {
          target: document.body,
          config: {childList: true},
          skipInitial: true,
          callback: () => true,
        });
      }
      override updated() {
        this.observerValue = this.observer.value;
      }
      resetObserverValue() {
        this.observer.value = this.observerValue = undefined;
      }
    }
    customElements.define(generateElementName(), A);

    const el = (await renderTestElement(A)) as A;
    assert.equal(el.observerValue, undefined);
    const d = document.createElement('div');
    document.body.appendChild(d);
    await nextFrame();
    assert.isTrue(el.observerValue);
    el.resetObserverValue();
    d.remove();
    await nextFrame();
    assert.isTrue(el.observerValue);
  });

  test('MutationController<T> type-checks', async () => {
    // This test only checks compile-type behavior. There are no runtime checks.
    const el = await getTestElement(() => ({
      target: null,
      config: {attributes: true},
    }));
    const A = new MutationController<number>(el, {
      // @ts-expect-error Type 'string' is not assignable to type 'number'
      callback: () => '',
      config: {attributes: true},
    });
    if (A) {
      // Suppress no-unused-vars warnings
    }

    const B = new MutationController(el, {
      callback: () => '',
      config: {attributes: true},
    });
    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    B.value = 2;

    const C = new MutationController(el, {
      config: {attributes: true},
    }) as MutationController<string>;
    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    C.value = 3;

    const narrowTypeCb: MutationValueCallback<string | null> = () => '';
    const D = new MutationController(el, {
      callback: narrowTypeCb,
      config: {attributes: true},
    });

    D.value = null;
    D.value = undefined;
    D.value = '';
    // @ts-expect-error Type 'number' is not assignable to type 'string'
    D.value = 3;
  });
});
