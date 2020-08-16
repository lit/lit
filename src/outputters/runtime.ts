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

import {Message, ProgramMessage, Placeholder} from '../messages';
import {applyPatches, Patches} from '../patches';
import {Locale} from '../locales';
import {Config} from '../config';
import {KnownError} from '../error';
import {escapeStringToEmbedInTemplateLiteral} from '../typescript';
import * as fs from 'fs';
import * as pathLib from 'path';

/**
 * Configuration specific to the `runtime` output mode.
 */
export interface RuntimeOutputConfig {
  mode: 'runtime';

  /**
   * Output directory for generated TypeScript modules. Into this directory will
   * be generated a <locale>.ts for each `targetLocale`, each a TypeScript
   * module that exports the translations in that locale keyed by message ID.
   */
  outputDir: string;
}

/**
 * Write output for the `runtime` output mode.
 */
export function runtimeOutput(
  messages: ProgramMessage[],
  translationMap: Map<Locale, Message[]>,
  config: Config,
  runtimeConfig: RuntimeOutputConfig
) {
  for (const locale of config.targetLocales) {
    const translations = translationMap.get(locale) || [];
    const ts = generateLocaleModule(
      locale,
      translations,
      messages,
      config.patches || {}
    );
    const filename = pathLib.join(
      config.resolve(runtimeConfig.outputDir),
      `${locale}.ts`
    );
    try {
      fs.writeFileSync(filename, ts);
    } catch (e) {
      throw new KnownError(
        `Error writing TypeScript file: ${filename}\n` +
          `Does the parent directory exist, ` +
          `and do you have write permission?\n` +
          e.message
      );
    }
  }
}

/**
 * Generate a "<locale>.ts" TypeScript module from the given bundle of
 * translated messages.
 */
function generateLocaleModule(
  locale: Locale,
  translations: Message[],
  canonMsgs: ProgramMessage[],
  patches: Patches
): string {
  translations = copyMessagesSortedByName(translations);
  // The unique set of message names in the canonical messages we extracted from
  // the TypeScript program.
  const canonMsgsByName = new Map<string, ProgramMessage>();
  for (const canon of canonMsgs) {
    canonMsgsByName.set(canon.name, canon);
  }

  // The unique set of message names we found in this XLB translations file.
  const translatedMsgNames = new Set<string>();

  // Whether we'll need to import the lit-html "html" function.
  let importLit = false;

  const entries = [];
  for (const msg of translations) {
    const canon = canonMsgsByName.get(msg.name);
    if (canon === undefined) {
      console.warn(
        `${locale} message ${msg.name} does not exist in canonical messages, skipping`
      );
      continue;
    }
    translatedMsgNames.add(msg.name);
    const msgStr = makeMessageString(msg.contents, canon);
    const patchedMsgStr = applyPatches(patches, locale, msg.name, msgStr);
    entries.push(`${msg.name}: ${patchedMsgStr},`);
  }
  for (const msg of canonMsgs) {
    if (msg.isLitTemplate) {
      importLit = true;
    }
    if (translatedMsgNames.has(msg.name)) {
      continue;
    }
    console.warn(
      `${locale} message ${msg.name} is missing, using canonical text as fallback`
    );
    const msgStr = makeMessageString(msg.contents, msg);
    entries.push(`${msg.name}: ${msgStr},`);
  }
  return `
    // Do not modify this file by hand!
    // Re-generate this file by running lit-localize

    ${importLit ? "import {html} from 'lit-html';" : ''}

    /* eslint-disable no-irregular-whitespace */
    /* eslint-disable @typescript-eslint/no-explicit-any */

    export const templates = {
      ${entries.join('\n')}
    };
  `;
}

/**
 * Sort by message name for easier diffing. Note that unlike XLB files, where
 * order corresponds to how translators will see our strings, order is not
 * semantically meaningful in the generated TypeScript files.
 */
function copyMessagesSortedByName(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Convert the contents of a message to a TypeScript string, possibly using
 * lit-html if there is embedded HTML.
 */
function makeMessageString(
  contents: Array<string | Placeholder>,
  canon: ProgramMessage
): string {
  const fragments = [];
  for (const content of contents) {
    if (typeof content === 'string') {
      fragments.push(escapeStringToEmbedInTemplateLiteral(content));
    } else {
      fragments.push(content.untranslatable);
    }
  }
  const tag = canon.isLitTemplate ? 'html' : '';
  const msgStr = `${tag}\`${fragments.join('')}\``;
  if (canon.params !== undefined && canon.params.length > 0) {
    return `(${canon.params
      .map((param) => `${param}: any`)
      .join(', ')}) => ${msgStr}`;
  } else {
    return msgStr;
  }
}
