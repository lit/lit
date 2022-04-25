/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Union of configuration objects for each of the supported interchange
 * formatters.
 */
export type FormatConfig = XlbConfig | XliffConfig;

/**
 * Parse an XLB XML file. These files contain translations organized using the
 * same message names that we originally requested.
 * Configuration for XLB interchange format.
 */
export interface XlbConfig {
  format: 'xlb';

  /**
   * Output path on disk to the XLB XML file that will be created containing all
   * messages extracted from the source. E.g. "data/localization/en.xlb".
   */
  outputFile: string;

  /**
   * Glob pattern of XLB XML files to read from disk containing translated
   * messages. E.g. "data/localization/*.xlb".
   *
   * See https://github.com/isaacs/node-glob#README for valid glob syntax.
   */
  translationsGlob: string;
}

/**
 * Configuration for XLIFF interchange format.
 */
export interface XliffConfig {
  format: 'xliff';

  /**
   * Directory on disk to read/write .xlf XML files. For each target locale,
   * the file path "<xliffDir>/<locale>.xlf" will be used.
   */
  xliffDir: string;

  /**
   * How to represent placeholders containing HTML markup and dynamic
   * expressions. Different localization tools and services have varying support
   * for placeholder syntax.
   *
   * Defaults to "x". Options:
   *
   * - "x": Emit placeholders using <x> tags. See
   *   http://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#x
   *
   * - "ph": Emit placeholders using <ph> tags. See
   *   http://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html#ph
   */
  placeholderStyle?: 'x' | 'ph';
}
