/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import type {Locale} from './types/locale.js';

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
   * Description for this message.
   */
  desc: string | undefined;

  /**
   * The template literal tag this message has.
   */
  tag: 'html' | 'str' | undefined;
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
 * the translator, but not modified. We use placeholders to contain embedded
 * HTML extracted from Lit templates.
 */
export interface Placeholder {
  untranslatable: string;
  index: number;
  // TODO(aomarks) Placeholders can also have names and examples, to help the
  // translator understand the meaning of the placeholder. We could
  // automatically add names for common markup patterns like START_BOLD and
  // END_BOLD, and also allow a way to define them in the template (e.g. a
  // "placeholder-name" element attribute or similar).
}

/**
 * Given an array of messages, return a new map from message ID to message.
 */
export function makeMessageIdMap<T extends Message>(
  messages: T[]
): Map<string, T> {
  const map = new Map<string, T>();
  for (const msg of messages) {
    map.set(msg.name, msg);
  }
  return map;
}

/**
 * Sort by message description, then filename (for determinism, in case there is
 * no description, since file-process order is arbitrary), then by source-code
 * position order. The order of entries in interchange files can be significant,
 * e.g. in determining the order in which messages are displayed to translators.
 * We want messages that are logically related to be presented together.
 */
export function sortProgramMessages(
  messages: ProgramMessage[]
): ProgramMessage[] {
  return messages.sort((a, b) => {
    if (a.desc ?? '' !== b.desc ?? '') {
      return (a.desc ?? '').localeCompare(b.desc ?? '');
    }
    return a.file.fileName.localeCompare(b.file.fileName);
  });
}

/**
 * Check that for every localized message, the set of placeholders in the
 * localized version is equal to the set of placeholders in the source version
 * (no more, no less, no changes, but order can change).
 *
 * It is important to validate this condition because placeholders can contain
 * arbitrary HTML and JavaScript template literal placeholder expressions, will
 * be substituted back into generated executable source code. A well behaving
 * localization process/tool would not allow any modification of these
 * placeholders, but we can't assume that to be the case, so it is a potential
 * source of bugs and attacks and must be validated.
 */
export function validateLocalizedPlaceholders(
  programMessages: Message[],
  localizedMessages: Map<Locale, Message[]>
): string[] {
  const errors = [];
  const programMap = makeMessageIdMap(programMessages);
  for (const [locale, messages] of localizedMessages) {
    for (const localizedMsg of messages) {
      const programMsg = programMap.get(localizedMsg.name);
      if (programMsg === undefined) {
        // It's OK if a message doesn't exist at all in the source code because
        // we skip over those during code generation.
        continue;
      }

      // Note that two identical placeholders could appear in the same template,
      // and it matters how many of them there are, hence we use an array, not a
      // set (might be good to implement some form of multiset here).
      const remainingProgramPlaceholders = [];
      for (const content of programMsg.contents) {
        if (typeof content !== 'string') {
          remainingProgramPlaceholders.push(content.untranslatable);
        }
      }

      for (const content of localizedMsg.contents) {
        if (typeof content !== 'string') {
          const placeholder = content.untranslatable;
          const index = remainingProgramPlaceholders.indexOf(placeholder);
          if (index === -1) {
            errors.push(
              `Placeholder error in ${locale} ` +
                `localization of ${localizedMsg.name}: ` +
                `unexpected "${placeholder}"`
            );
          } else {
            remainingProgramPlaceholders.splice(index, 1);
          }
        }
      }

      for (const placeholder of remainingProgramPlaceholders) {
        errors.push(
          `Placeholder error in ${locale} ` +
            `localization of ${localizedMsg.name}: ` +
            `missing "${placeholder}"`
        );
      }
    }
  }
  return errors;
}
