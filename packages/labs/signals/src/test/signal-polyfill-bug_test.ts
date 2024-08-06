/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {signal, computed, Signal} from '../index.js';

suite('signal-polyfill bug', () => {
  test('the bug is present', async () => {
    // Tests for the presence of https://github.com/proposal-signals/signal-polyfill/issues/27
    // When that bug is fixed we can remove workarounds in watch.ts.
    const count = signal(0);
    const countPlusOne = computed(() => {
      return count.get() + 1;
    });
    const watcher = new Signal.subtle.Watcher(() => {});
    watcher.watch(countPlusOne);

    assert.equal(countPlusOne.get(), 1);
    count.set(1);
    assert.equal(countPlusOne.get(), 2);

    watcher.unwatch(countPlusOne);
    count.set(2);
    watcher.watch(countPlusOne);

    // This should be 3, but the bug causes it to be 2.
    assert.equal(countPlusOne.get(), 2);
  });
});
