/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReferenceToCommand} from '../command.js';

export const localize: ReferenceToCommand = {
  kind: 'reference',
  name: 'localize',
  description: 'Lit localize',
  importSpecifier: '@lit-labs/cli-localize',
  installFrom: '@lit-labs/cli-localize',
};
