/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const someSymbol = Symbol();

export class ClassWithUnsupportedProperty {
  [someSymbol] = 1;
}
