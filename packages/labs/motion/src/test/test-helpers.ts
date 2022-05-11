/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {CSSValues} from '../animate.js';
import {assert} from '@esm-bundle/chai';

let count = 0;
export const generateElementName = () => `x-${count++}`;

export const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export const assertDeepCloseTo = (
  source: CSSValues,
  expected: CSSValues,
  delta = 0.1
) => {
  Object.entries(expected).forEach(([k, v]) => {
    assert.closeTo(v as number, source[k] as number, delta);
  });
};

export const sleep = async (delay = 100) =>
  new Promise((r) => setTimeout(r, delay));
