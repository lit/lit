/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {TemplateResult} from 'lit';
import type {StrResult} from './str-tag.js';

/**
 * The template-like types that can be passed to `msg`.
 */
export type TemplateLike = string | TemplateResult | StrResult;

/**
 * A mapping from template ID to template.
 */
export type TemplateMap = {[id: string]: TemplateLike};

/**
 * The expected exports of a locale module.
 */
export interface LocaleModule {
  templates: TemplateMap;
}

export interface MsgOptions {
  /**
   * Optional project-wide unique identifier for this template. If omitted, an
   * id will be automatically generated from the template strings.
   */
  id?: string;

  /**
   * Optional description of this message.
   */
  desc?: string;
}

declare function msg(template: string, options?: MsgOptions): string;
declare function msg(template: StrResult, options?: MsgOptions): string;
declare function msg(
  template: TemplateResult,
  options?: MsgOptions
): TemplateResult;
declare function msg(
  template: TemplateLike,
  options?: MsgOptions
): string | TemplateResult;

export type MsgFn = typeof msg & {_LIT_LOCALIZE_MSG_?: never};
