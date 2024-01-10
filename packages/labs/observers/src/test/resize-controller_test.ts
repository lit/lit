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
  ResizeController,
  ResizeControllerConfig,
  ResizeValueCallback,
} from '@lit-labs/observers/resize-controller.js';
import {generateElementName, nextFrame} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!ReactiveElement.enableWarning;

if (DEV_MODE) {
  ReactiveElement.disableWarning?.('change-in-update');
}

(window.ResizeObserver ? suite : suite.skip)('ResizeController', () => {
  let container: HTMLElement;

  interface TestElement extends ReactiveElement {
    observer: ResizeController;
    observerValue: unknown;
    resetObserverValue: () => void;
    changeDuringUpdate?: () => void;
  }

  const defineTestElement = (
    getControllerConfig: (
      host: ReactiveControllerHost
    ) => ResizeControllerConfig
  ) => {
    class A extends ReactiveElement {
      observer: ResizeController;
      observerValue: unknown;
      changeDuringUpdate?: () => void;
      constructor() {
        super();
        const config = getControllerConfig(this);
        this.observer = new ResizeController(this, {
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

  let size = 1;
  const resizeElement = (el: HTMLElement, x?: number) => {
    el.style.display = 'block';
    el.style.position = 'absolute';
    const d = x !== undefined ? x : size++;
    el.style.height = el.style.width = `${d}px`;
  };

  const resizeComplete = async () => {
    await nextFrame();
    await nextFrame();
  };

  const getTestElement = async (
    getControllerConfig: (
      host: ReactiveControllerHost
    ) => ResizeControllerConfig = () => ({})
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
    const el = await getTestElement();

    // Reports initial change by default
    assert.isTrue(el.observerValue);

    // Reports attribute change
    el.resetObserverValue();
    resizeElement(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports another attribute change
    el.resetObserverValue();
    el.requestUpdate();
    await resizeComplete();
    assert.isUndefined(el.observerValue);
    resizeElement(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('skips initial changes when `skipInitial` is `true`', async () => {
    const el = await getTestElement(() => ({
      skipInitial: true,
    }));

    // Does not reports initial change when `skipInitial` is set
    assert.isUndefined(el.observerValue);

    // Reports subsequent attribute change when `skipInitial` is set
    el.resetObserverValue();
    resizeElement(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports another attribute change
    el.resetObserverValue();
    el.requestUpdate();
    await resizeComplete();
    assert.isUndefined(el.observerValue);
    resizeElement(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('observation managed via connection', async () => {
    const el = await getTestElement(() => ({
      skipInitial: true,
    }));
    assert.isUndefined(el.observerValue);

    // Does not report change after element removed.
    el.remove();
    resizeElement(el);

    // Reports change after element re-connected since this changes its size!
    container.appendChild(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change on mutation when element is connected
    el.resetObserverValue();
    resizeElement(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('can observe external element', async () => {
    const d = document.createElement('div');
    container.appendChild(d);
    const el = await getTestElement(() => ({
      target: d,
      skipInitial: true,
    }));
    assert.equal(el.observerValue, undefined);
    resizeElement(d);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Change again
    el.resetObserverValue();
    resizeElement(d);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('can manage value via `callback`', async () => {
    const el = await getTestElement(() => ({
      callback: (entries: ResizeObserverEntry[]) =>
        entries[0]?.contentRect.width ?? true,
    }));
    resizeElement(el, 100);
    await resizeComplete();
    // assert.equal(el.observerValue as number, 100);
    resizeElement(el, 150);
    await resizeComplete();
    // assert.equal(el.observerValue as number, 150);
  });

  test('can observe changes during update', async () => {
    const el = await getTestElement(() => ({
      callback: (entries: ResizeObserverEntry[]) =>
        entries[0]?.contentRect.width ?? true,
    }));
    // Change size during update.
    let s = 100;
    el.changeDuringUpdate = () => resizeElement(el, s);
    el.resetObserverValue();
    el.requestUpdate();
    await resizeComplete();
    assert.equal(el.observerValue as number, 100);

    // Change size again during update.
    s = 150;
    el.resetObserverValue();
    el.requestUpdate();
    await resizeComplete();
    assert.equal(el.observerValue as number, 150);

    // Update without changing size.
    el.resetObserverValue();
    el.requestUpdate();
    await resizeComplete();
    assert.isUndefined(el.observerValue);
  });

  test('can call `observe` to observe element', async () => {
    const el = await getTestElement();
    el.resetObserverValue();
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.renderRoot.appendChild(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to observed target.
    el.resetObserverValue();
    resizeElement(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to configured target.
    el.resetObserverValue();
    resizeElement(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Can observe another target
    el.resetObserverValue();
    const d2 = document.createElement('div');
    el.observer.observe(d2);
    el.renderRoot.appendChild(d2);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to new observed target.
    el.resetObserverValue();
    resizeElement(d2);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to configured target.
    el.resetObserverValue();
    resizeElement(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to first observed target.
    el.resetObserverValue();
    resizeElement(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('can specifying target as `null` and call `observe` to observe element', async () => {
    const el = await getTestElement(() => ({target: null}));
    el.resetObserverValue();
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.renderRoot.appendChild(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to observed target.
    el.resetObserverValue();
    resizeElement(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Can observe another target
    el.resetObserverValue();
    const d2 = document.createElement('div');
    el.observer.observe(d2);
    el.renderRoot.appendChild(d2);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to new observed target.
    el.resetObserverValue();
    resizeElement(d2);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to first observed target.
    el.resetObserverValue();
    resizeElement(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('observed targets are re-observed on host connected', async () => {
    const el = await getTestElement(() => ({target: null}));
    const d1 = document.createElement('div');
    const d2 = document.createElement('div');

    el.renderRoot.appendChild(d1);
    el.renderRoot.appendChild(d2);

    el.observer.observe(d1);
    el.observer.observe(d2);

    await resizeComplete();
    el.resetObserverValue();
    el.remove();

    container.appendChild(el);

    // Reports change to first observed target.
    el.resetObserverValue();
    resizeElement(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Reports change to second observed target.
    el.resetObserverValue();
    resizeElement(d2);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('observed target respects `skipInitial`', async () => {
    const el = await getTestElement(() => ({
      target: null,
      skipInitial: true,
    }));
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.renderRoot.appendChild(d1);
    await resizeComplete();
    // Note, appending changes size!
    assert.isTrue(el.observerValue);

    // Reports change to observed target.
    resizeElement(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('observed target re-observed on connection', async () => {
    const el = await getTestElement(() => ({target: null}));
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.renderRoot.appendChild(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);
    el.resetObserverValue();
    await resizeComplete();
    el.remove();

    // Does not report change when disconnected.
    resizeElement(d1);
    await resizeComplete();
    assert.isUndefined(el.observerValue);

    // Reports change when re-connected
    container.appendChild(el);
    resizeElement(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('can observe changes when initialized after host connected', async () => {
    class TestFirstUpdated extends ReactiveElement {
      observer!: ResizeController<true>;
      observerValue: true | undefined = undefined;
      override firstUpdated() {
        this.observer = new ResizeController(this, {
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
    assert.isUndefined(el.observerValue);
    resizeElement(el);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('can observe external element after host connected', async () => {
    const d = document.createElement('div');
    container.appendChild(d);
    class A extends ReactiveElement {
      observer!: ResizeController<true>;
      observerValue: true | undefined = undefined;
      override firstUpdated() {
        this.observer = new ResizeController(this, {
          target: d,
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
    resizeElement(d);
    await resizeComplete();
    assert.isTrue(el.observerValue);

    // Change again
    el.resetObserverValue();
    assert.equal(el.observerValue, undefined);
    resizeElement(d);
    await resizeComplete();
    assert.isTrue(el.observerValue);
  });

  test('ResizeController<T> type-checks', async () => {
    // This test only checks compile-type behavior. There are no runtime checks.
    const el = await getTestElement();
    const A = new ResizeController<number>(el, {
      // @ts-expect-error Type 'number' is not assignable to type 'string'
      callback: () => '',
    });
    if (A) {
      // Suppress no-unused-vars warnings
    }

    const B = new ResizeController(el, {
      callback: () => '',
    });
    // @ts-expect-error Type 'number' is not assignable to type 'string'
    B.value = 2;

    const C = new ResizeController(el, {}) as ResizeController<string>;
    // @ts-expect-error Type 'number' is not assignable to type 'string'
    C.value = 3;

    const narrowTypeCb: ResizeValueCallback<string | null> = () => '';
    const D = new ResizeController(el, {callback: narrowTypeCb});

    D.value = null;
    D.value = undefined;
    D.value = '';
    // @ts-expect-error Type 'number' is not assignable to type 'string'
    D.value = 3;
  });

  test('observed target can be unobserved', async () => {
    const el = await getTestElement(() => ({target: null}));
    const d1 = document.createElement('div');

    // Reports initial changes when observe called.
    el.observer.observe(d1);
    el.renderRoot.appendChild(d1);
    await resizeComplete();
    assert.isTrue(el.observerValue);
    el.resetObserverValue();
    await resizeComplete();

    // Does not report change when unobserved
    el.observer.unobserve(d1);
    resizeElement(d1);
    await resizeComplete();
    assert.isUndefined(el.observerValue);

    el.remove();
    container.appendChild(el);

    // Does not report changes when re-connected
    resizeElement(d1);
    await resizeComplete();
    assert.isUndefined(el.observerValue);
  });
});
