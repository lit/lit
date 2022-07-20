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
} from '@lit-labs/observers/performance_controller.js';
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
  (el as any)?.observer.flush();
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

// TODO: disable these tests until can figure out issues with Sauce Safari
// version. They do pass on latest Safari locally.
suite.skip('PerformanceController', () => {
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
        this.observer = new PerformanceController(this, config);
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
});
