/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Mocked interface so the `canTest` function type checks.
declare global {
  interface Window {
    ShadowRootInit?: {};
    ShadyDOM?: {
      inUse: boolean;
    };
  }
}

// Only test if ShadowRoot is available and either ShadyDOM is not
// in use or it is and platform support is available. Prevents ie11 from
// running scoped-registry-mixin tests.
export const canTest =
  window.ShadowRoot && !window.ShadyDOM?.inUse && window.ShadowRootInit;
