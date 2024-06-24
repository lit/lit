/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export * from './internal/locale-status-event.js';
export * from './internal/str-tag.js';
export * from './internal/types.js';
export {msg} from './init/install.js';

// TODO(aomarks) In a future breaking version, remove these imports so that the
// bulk of the code isn't included in bundles by default. In particular imagine
// the component library use-case where msg() calls are made, but there is no
// need to actually initialize any of the localization runtime.
export * from './internal/localized-controller.js';
export * from './internal/localized-decorator.js';
export * from './init/runtime.js';
export * from './init/transform.js';
