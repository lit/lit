/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This module exports decorators that are compatible with TypeScript's
// experimentalDecorators option. At some point, the default decorators we
// export from ./decorators.js will be the standard decorators, not these,
// so you can import this file directly to future-proof code that uses
// experimentalDecorators.

export * from './legacy-decorators/base.js';
export * from './legacy-decorators/custom-element.js';
export * from './legacy-decorators/property.js';
export * from './legacy-decorators/state.js';
export * from './legacy-decorators/event-options.js';
export * from './legacy-decorators/query.js';
export * from './legacy-decorators/query-all.js';
export * from './legacy-decorators/query-async.js';
export * from './legacy-decorators/query-assigned-elements.js';
export * from './legacy-decorators/query-assigned-nodes.js';
