/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {TemplateLike, MsgFn, MsgOptions} from './internal/types.js';

export * from './internal/locale-status-event.js';
export * from './internal/str-tag.js';
export * from './internal/types.js';

// TODO(aomarks) In a future breaking version, remove these imports so that the
// bulk of the code isn't included in bundles by default. In particular imagine
// the component library use-case where msg() calls are made, but there is no
// need to actually initialize any of the localization runtime.
export * from './internal/localized-controller.js';
export * from './internal/localized-decorator.js';
export * from './init/runtime.js';
export * from './init/transform.js';

let msgImpl = ((template: TemplateLike) => template) as MsgFn;
let installed = false;

/**
 * Internal only. Do not use this function.
 *
 * Installs an implementation of the msg function to replace the default
 * identity function. Throws if called more than once.
 *
 * @internal
 */
export function _installMsgImplementation(msg: MsgFn) {
  if (installed) {
    throw new Error('lit-localize can only be configured once');
  }
  msgImpl = msg;
  installed = true;
}

/**
 * Make a string or lit-html template localizable.
 *
 * @param template A string, a lit-html template, or a function that returns
 * either a string or lit-html template.
 * @param options Optional configuration object with the following properties:
 *   - id: Optional project-wide unique identifier for this template. If
 *     omitted, an id will be automatically generated from the template strings.
 *   - desc: Optional description
 */
export const msg = ((template: TemplateLike, options?: MsgOptions) =>
  msgImpl(template as string, options)) as MsgFn;
