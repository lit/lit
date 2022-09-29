/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * This file exports a boolean const whose value will depend on what environment
 * the module is being imported from.
 */

const NODE_MODE = false;

/**
 * Boolean value that will `true` when imported via the "node" export condition
 * and `false` otherwise.
 */
export const isServer = NODE_MODE;
