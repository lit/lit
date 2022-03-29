/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import type { SimpleItem } from './simple-item.js';
export declare const runBenchmark: (renderApp: (data: SimpleItem[]) => Promise<void>) => Promise<void>;
