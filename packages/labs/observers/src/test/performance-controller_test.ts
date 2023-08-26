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
  PerformanceController,
  PerformanceControllerConfig,
  PerformanceValueCallback,
} from '@lit-labs/observers/performance-controller.js';
import {generateElementName, nextFrame} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!ReactiveElement.enableWarning;

if (DEV_MODE) {
  ReactiveElement.disableWarning?.('change-in-update');
}

const generateMeasure = async (sync = false) => {
  performance.mark('a');
  if (!sync) {
    await new Promise((resolve) => setTimeout(resolve));
  }
  performance.mark('b');
  performance.measure('measure', 'a', 'b');
};

const observerComplete = async (el?: HTMLElement) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (el as any)?.observer?.flush();
  await nextFrame();
  await nextFrame();
};

// const canTest = async () => {
//   let ok = false;
//   if (window.PerformanceObserver) {
//     const o = new PerformanceObserver(() => (ok = true));
//     o.observe({entryTypes: ['measure']});
//     await generateMeasure();
//   }
//   await observerComplete();
//   return ok;
// };

const canTest = () => {
  // TODO: disable tests on Sauce Safari until can figure out issues.
  // The tests pass on latest Safari locally.
  const isSafari =
    navigator.userAgent.includes('Safari/') &&
    navigator.userAgent.includes('Version/');
  return !isSafari && window.PerformanceObserver;
};

(canTest() ? suite : suite.skip)('PerformanceController', () => {
  let container: HTMLElement;

  interface TestElement extends ReactiveElement {
    observer: PerformanceController;
    observerValue: unknown;
    resetObserverValue: () => void;
    changeDuringUpdate?: () => void;
  }

  const defineTestElement = (
    getControllerConfig: (
      host: ReactiveControllerHost
    ) => PerformanceControllerConfig
  ) => {
    class A extends ReactiveElement {
      observer: PerformanceController;
      observerValue: unknown;
      changeDuringUpdate?: () => void;
      constructor() {
        super();
        const config = getControllerConfig(this);
        this.observer = new PerformanceController(this, {
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
    await observerComplete(el);
    return el;
  };

  const getTestElement = async (
    getControllerConfig: (
      host: ReactiveControllerHost
    ) => PerformanceControllerConfig
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
    const el = await getTestElement((_host: ReactiveControllerHost) => ({
      config: {entryTypes: ['measure']},
    }));

    // Reports initial change by default
    assert.isTrue(el.observerValue);

    // Reports attribute change
    el.resetObserverValue();
    await generateMeasure();
    await observerComplete(el);
    assert.isTrue(el.observerValue);

    // Reports another attribute change
    el.resetObserverValue();
    el.requestUpdate();
    await observerComplete(el);
    assert.isUndefined(el.observerValue);
    await generateMeasure();
    await observerComplete(el);
    assert.isTrue(el.observerValue);
  });

  test('can observe changes during update', async () => {
    const el = await getTestElement((_host: ReactiveControllerHost) => ({
      config: {entryTypes: ['measure']},
    }));
    el.resetObserverValue();
    el.changeDuringUpdate = () => generateMeasure(true);
    el.requestUpdate();
    await observerComplete(el);
    assert.isTrue(el.observerValue);
  });

  test('skips initial changes when `skipInitial` is `true`', async () => {
    const el = await getTestElement((_host: ReactiveControllerHost) => ({
      config: {entryTypes: ['measure']},
      skipInitial: true,
    }));

    // Does not reports initial change when `skipInitial` is set
    assert.isUndefined(el.observerValue);

    // Reports subsequent change when `skipInitial` is set
    el.resetObserverValue();
    await generateMeasure();
    await observerComplete(el);
    assert.isTrue(el.observerValue);

    // Reports another change
    el.resetObserverValue();
    el.requestUpdate();
    await nextFrame();
    assert.isUndefined(el.observerValue);
    await generateMeasure();
    await observerComplete(el);
    assert.isTrue(el.observerValue);
  });

  test('observation managed via connection', async () => {
    const el = await getTestElement((_host: ReactiveControllerHost) => ({
      config: {entryTypes: ['measure']},
      skipInitial: true,
    }));
    assert.isUndefined(el.observerValue);

    // Does not report change after element removed.
    el.remove();
    await generateMeasure();

    // Reports no change after element re-connected.
    container.appendChild(el);
    await observerComplete(el);
    assert.isUndefined(el.observerValue);

    // Reports change when element is connected
    await generateMeasure();
    await observerComplete(el);
    assert.isTrue(el.observerValue);
  });

  test('can manage value via `callback`', async () => {
    let count = 0;
    const el = await getTestElement((_host: ReactiveControllerHost) => ({
      config: {entryTypes: ['measure']},
      callback: (entries: PerformanceEntryList) =>
        `${count++}:${entries
          .map((r: PerformanceEntry) => r.duration)
          .reduce((a, c) => a + c, 0)}`,
    }));
    assert.equal(el.observerValue, '0:0');
    await generateMeasure();
    await observerComplete(el);
    assert.match(el.observerValue as string, /1:[\d]/);
    await generateMeasure();
    await observerComplete(el);
    assert.match(el.observerValue as string, /2:[\d]/);
  });

  test('can observe changes when initialized after host connected', async () => {
    class TestFirstUpdated extends ReactiveElement {
      observer!: PerformanceController<true>;
      observerValue: true | undefined = undefined;
      override firstUpdated() {
        this.observer = new PerformanceController(this, {
          config: {entryTypes: ['measure']},
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

    // Reports measure
    el.resetObserverValue();
    await generateMeasure();
    await observerComplete(el);
    assert.isTrue(el.observerValue);

    // Reports another measure after noop update
    el.resetObserverValue();
    el.requestUpdate();
    await observerComplete(el);
    assert.isUndefined(el.observerValue);
    await generateMeasure();
    await observerComplete(el);
    assert.isTrue(el.observerValue);
  });

  test('PerformanceController<T> type-checks', async () => {
    // This test only checks compile-type behavior. There are no runtime checks.
    const el = await getTestElement((_host: ReactiveControllerHost) => ({
      config: {entryTypes: ['measure']},
    }));
    const A = new PerformanceController<number>(el, {
      // @ts-expect-error Type 'string' is not assignable to type 'number'
      callback: () => '',
      config: {entryTypes: ['measure']},
    });
    if (A) {
      // Suppress no-unused-vars warnings
    }

    const B = new PerformanceController(el, {
      callback: () => '',
      config: {entryTypes: ['measure']},
    });
    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    B.value = 2;

    const C = new PerformanceController(el, {
      callback: () => '',
      config: {entryTypes: ['measure']},
    }) as PerformanceController<string>;
    // @ts-expect-error Type 'number' is not assignable to type 'string'.
    C.value = 3;

    const narrowTypeCb: PerformanceValueCallback<string | null> = () => '';
    const D = new PerformanceController(el, {
      callback: narrowTypeCb,
      config: {entryTypes: ['measure']},
    });

    D.value = null;
    D.value = undefined;
    D.value = '';
    // @ts-expect-error Type 'number' is not assignable to type 'string'
    D.value = 3;
  });
});
