/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export interface BarInterface {
  bar: boolean;
}

export class Bar implements BarInterface {
  bar = true;
}

export class Foo<T extends BarInterface> {
  bar?: T;
}
