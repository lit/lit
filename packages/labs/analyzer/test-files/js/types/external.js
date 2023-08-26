/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export class ImportedClass {
  /** @type {number} */
  someData;
}

/**
 * @typedef ImportedInterface
 * @prop {number} someData
 */

export const returnsClass = () => {
  return new ImportedClass();
};
