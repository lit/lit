/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '../../reactive-element.js';
import {property} from '../../decorators/property.js';
import {computed} from '../../decorators/computed.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('@computed', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container !== undefined) {
      container.parentElement!.removeChild(container);
      (container as any) = undefined;
    }
  });

  test('can compute value', async () => {
    let computedValue = 1;
    class E extends ReactiveElement {
      @property()
      @computed(() => computedValue, [])
      computedProp = -1;
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    assert.equal(el.computedProp, -1);
    await el.updateComplete;
    assert.equal(el.computedProp, 1);
    computedValue++;
    el.requestUpdate();
    await el.updateComplete;
    assert.equal(el.computedProp, 2);
  });

  test('can use deps', async () => {
    class E extends ReactiveElement {
      @property()
      @computed((dep1: number, dep2: number) => dep1 + dep2, ['dep1', 'dep2'])
      computedProp = -1;

      @property()
      dep1 = 1;

      @property()
      dep2 = 2;
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    assert.equal(el.computedProp, -1);
    await el.updateComplete;
    assert.equal(el.computedProp, 3);
    el.dep2 = 5;
    await el.updateComplete;
    assert.equal(el.computedProp, 6);
    el.dep1 = 3;
    el.dep2 = 11;
    await el.updateComplete;
    assert.equal(el.computedProp, 14);
  });

  test('deps can be computed properties', async () => {
    class E extends ReactiveElement {
      @property()
      @computed((c1d1, c2) => c1d1 + c2, ['c1d1', 'c2'])
      c1 = -1;

      @property()
      c1d1 = 1;

      @property()
      @computed((c2d1, c3) => c2d1 + c3, ['c2d1', 'c3'])
      c2 = -2;

      @property()
      c2d1 = 2;

      @property()
      @computed((c3d1, c3d2) => c3d1 + c3d2, ['c3d1', 'c3d2'])
      c3 = -3;

      @property()
      c3d1 = 3;

      @property()
      c3d2 = 4;

      @property()
      @computed((c1, c2, c3) => c1 + c2 + c3, ['c1', 'c2', 'c3'])
      total = -4;
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    assert.equal(el.c3, -3);
    assert.equal(el.c2, -2);
    assert.equal(el.c1, -1);
    assert.equal(el.total, -4);
    await el.updateComplete;
    assert.equal(el.c3, 7);
    assert.equal(el.c2, 9);
    assert.equal(el.c1, 10);
    assert.equal(el.total, 26);
    el.c3d1 = 10;
    await el.updateComplete;
    assert.equal(el.c3, 14);
    assert.equal(el.c2, 16);
    assert.equal(el.c1, 17);
    assert.equal(el.total, 47);
    el.c1d1 = 50;
    el.c2d1 = 60;
    el.c3d1 = 70;
    el.c3d2 = 80;
    await el.updateComplete;
    assert.equal(el.c3, 150);
    assert.equal(el.c2, 210);
    assert.equal(el.c1, 260);
    assert.equal(el.total, 620);
  });

  test('computes only if deps change', async () => {
    let didCompute = false;
    class E extends ReactiveElement {
      @property()
      @computed(
        (dep1: number, dep2: number) => {
          didCompute = true;
          return dep1 + dep2;
        },
        ['dep1', 'dep2']
      )
      computedProp = -1;

      @property()
      dep1 = 1;

      @property()
      dep2 = 2;
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    assert.equal(el.computedProp, -1);
    await el.updateComplete;
    assert.isTrue(didCompute);
    didCompute = false;
    el.requestUpdate();
    await el.updateComplete;
    assert.isFalse(didCompute);
    didCompute = false;
    el.dep2 = 5;
    await el.updateComplete;
    assert.isTrue(didCompute);
  });

  test('values computed at most once per update', async () => {
    let c1Count = 0;
    let c2Count = 0;
    let c3Count = 0;
    let c4Count = 0;
    const assertCounts = (
      count1: number,
      count2: number,
      count3: number,
      count4: number
    ) => {
      assert.equal(c1Count, count1);
      assert.equal(c2Count, count2);
      assert.equal(c3Count, count3);
      assert.equal(c4Count, count4);
      c1Count = c2Count = c3Count = c4Count = 0;
    };
    class E extends ReactiveElement {
      @property()
      @computed(
        (c1d1, c2) => {
          c1Count++;
          return c1d1 + c2;
        },
        ['c1d1', 'c2']
      )
      c1 = -1;

      @property()
      c1d1 = 1;

      @property()
      @computed(
        (c2d1, c3) => {
          c2Count++;
          return c2d1 + c3;
        },
        ['c2d1', 'c3']
      )
      c2 = -2;

      @property()
      c2d1 = 2;

      @property()
      @computed(
        (c3d1, c3d2) => {
          c3Count++;
          return c3d1 + c3d2;
        },
        ['c3d1', 'c3d2']
      )
      c3 = -3;

      @property()
      c3d1 = 3;

      @property()
      c3d2 = 4;

      @property()
      @computed(
        (c1, c2, c3) => {
          c4Count++;
          return c1 + c2 + c3;
        },
        ['c1', 'c2', 'c3']
      )
      total = -4;
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    assertCounts(0, 0, 0, 0);
    await el.updateComplete;
    assertCounts(1, 1, 1, 1);
    el.c1d1 = 10;
    await el.updateComplete;
    assertCounts(1, 0, 0, 1);
    el.c1d1 = 10;
    await el.updateComplete;
    assertCounts(0, 0, 0, 0);
    el.c2d1 = 60;
    await el.updateComplete;
    assertCounts(1, 1, 0, 1);
    el.c3d1 = 70;
    await el.updateComplete;
    assertCounts(1, 1, 1, 1);
    el.requestUpdate();
    await el.updateComplete;
    assertCounts(0, 0, 0, 0);
  });

  test('compute function cannot reference element', async () => {
    class E extends ReactiveElement {
      @property()
      @computed(() => {
        assert.notOk(this);
        return 'ok';
      }, [])
      computedProp = '';
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.computedProp, 'ok');
  });
});
