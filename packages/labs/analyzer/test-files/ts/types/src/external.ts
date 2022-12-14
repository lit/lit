/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export class ImportedClass {
  someData: number;
}
export interface ImportedInterface {
  someData: number;
}

export const returnsClass = () => {
  return new ImportedClass();
};
