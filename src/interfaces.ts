/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as ts from 'typescript';
import {Locale} from './locales';

/**
 * A message for translation.
 */
export interface Message {
  /**
   * The unique name for this message.
   */
  name: string;

  /**
   * A sequence of translatable strings and untranslatable placeholders.
   */
  contents: Array<string | Placeholder>;
}

/**
 * Extension to "Message" with additional properties that are known only when
 * extracting from the TypeScript program, but not when reading translated
 * files.
 */
export interface ProgramMessage extends Message {
  /**
   * The TypeScript file that this message was extracted from. Used for
   * reporting errors.
   */
  file: ts.SourceFile;

  /**
   * The AST node in the TypeScript file that this message was extracted from.
   * Used for reporting errors.
   */
  node: ts.Node;

  /**
   * The stack of "msgdesc:" comments at the point where this message was
   * extracted. Used for generating "desc" attributes in our XLB file.
   */
  descStack: string[];

  /**
   * Parameters to this message.
   */
  params?: string[];

  /**
   * True if this message was tagged as a lit-html template.
   */
  isLitTemplate: boolean;
}

/**
 * A set of translated messages for a particular locale.
 */
export interface Bundle {
  locale: Locale;
  messages: Message[];
}

/**
 * A placeholder is a allows a bit of untranslatable text to be re-positioned by
 * the translator, but not modified. We use placeholders to contain embedded HTML
 * extracted from lit-html templates.
 */
export interface Placeholder {
  untranslatable: string;
  // TODO(aomarks) Placeholders can also have names and examples, to help the
  // translator understand the meaning of the placeholder. We could
  // automatically add names for common markup patterns like START_BOLD and
  // END_BOLD, and also allow a way to define them in the template (e.g. a
  // "placeholder-name" element attribute or similar).
}
