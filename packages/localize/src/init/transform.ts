/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {defaultMsg} from '../internal/default-msg.js';
import {_installMsgImplementation} from './install.js';

/**
 * Configuration parameters for lit-localize when in transform mode.
 */
export interface TransformConfiguration {
  /**
   * Required locale code in which source templates in this project are written,
   * and the active locale.
   */
  sourceLocale: string;
}

/**
 * Set configuration parameters for lit-localize when in transform mode. Returns
 * an object with function:
 *
 * - `getLocale`: Return the active locale code.
 *
 * Throws if called more than once.
 */
export const configureTransformLocalization: ((
  config: TransformConfiguration
) => {getLocale: () => string}) & {
  _LIT_LOCALIZE_CONFIGURE_TRANSFORM_LOCALIZATION_?: never;
} = (config: TransformConfiguration) => {
  _installMsgImplementation(defaultMsg);
  const sourceLocale = config.sourceLocale;
  return {
    getLocale: () => sourceLocale,
  };
};
