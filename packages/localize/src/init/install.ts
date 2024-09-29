import type {MsgFn} from '../internal/types.js';
import {defaultMsg} from '../internal/default-msg.js';

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
export let msg: MsgFn = defaultMsg;

let installed = false;

/**
 * Internal only. Do not use this function.
 *
 * Installs an implementation of the msg function to replace the default
 * identity function. Throws if called more than once.
 *
 * @internal
 */
export function _installMsgImplementation(impl: MsgFn) {
  if (installed) {
    throw new Error('lit-localize can only be configured once');
  }
  msg = impl;
  installed = true;
}
