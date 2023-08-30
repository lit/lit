/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This module exports decorators that are compatible with TypeScript's
// experimentalDecorators option. At some point, the default decorators we
// export from ./decorators.js will be the standard decorators, not these,
// so you can import this file directly to future-proof code that uses
// experimentalDecorators.

export * from './decorators/custom-element.js';
export * from './decorators/property.js';
export * from './decorators/state.js';
export * from './decorators/event-options.js';
export * from './decorators/query.js';
export * from './decorators/query-all.js';
export * from './decorators/query-async.js';
export * from './decorators/query-assigned-elements.js';
export * from './decorators/query-assigned-nodes.js';
