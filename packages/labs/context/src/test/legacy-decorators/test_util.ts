/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

declare global {
  interface Window {
    gc: () => void;
  }
  interface Performance {
    memory: {
      usedJSHeapSize: number;
    };
  }
}

const canRunMemoryTests =
  globalThis.performance?.memory?.usedJSHeapSize && window.gc;

export const memorySuite = canRunMemoryTests ? suite : suite.skip;
