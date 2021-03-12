/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Message, ProgramMessage, Placeholder} from '../messages';
import {applyPatches, Patches} from '../patches';
import {Locale, writeLocaleCodesModule} from '../locales';
import {Config} from '../config';
import {KnownError} from '../error';
import {
  escapeStringToEmbedInTemplateLiteral,
  parseStringAsTemplateLiteral,
} from '../typescript';
import * as fsExtra from 'fs-extra';
import * as pathLib from 'path';
import * as ts from 'typescript';

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

  /**
   * Optional filepath for a generated TypeScript module that exports
   * `sourceLocale`, `targetLocales`, and `allLocales` using the locale codes
   * from your config file. Use to keep your config file and client config in
   * sync. For example:
   *
   *   export const sourceLocale = 'en';
   *   export const targetLocales = ['es-419', 'zh_CN'] as const;
   *   export const allLocales = ['es-419', 'zh_CN', 'en'] as const;
   */
  localeCodesModule?: string;
}

/**
 * Write output for the `runtime` output mode.
 */
export async function runtimeOutput(
  messages: ProgramMessage[],
  translationMap: Map<Locale, Message[]>,
  config: Config,
  runtimeConfig: RuntimeOutputConfig
) {
  const writes = [];
  if (runtimeConfig.localeCodesModule) {
    writes.push(
      writeLocaleCodesModule(
        config.sourceLocale,
        config.targetLocales,
        runtimeConfig.localeCodesModule
      )
    );
  }
  const outputDir = config.resolve(runtimeConfig.outputDir);
  try {
    fsExtra.ensureDirSync(outputDir);
  } catch (e) {
    throw new KnownError(
      `Error creating TypeScript locales directory: ${outputDir}\n` +
        `Do you have write permission?\n` +
        e.message
    );
  }
  for (const locale of config.targetLocales) {
    const translations = translationMap.get(locale) || [];
    const ts = generateLocaleModule(
      locale,
      translations,
      messages,
      config.patches || {}
    );
    const filename = pathLib.join(outputDir, `${locale}.ts`);
    writes.push(
      fsExtra.writeFile(filename, ts, 'utf8').catch((e) => {
        throw new KnownError(
          `Error writing TypeScript file: ${filename}\n` +
            `Do you have write permission?\n` +
            e.message
        );
      })
    );
  }
  await Promise.all(writes);
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
    entries.push(`'${msg.name}': ${patchedMsgStr},`);
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
    entries.push(`'${msg.name}': ${msgStr},`);
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
  // Translations can modify the order of expressions in a template. We encode
  // local expression order by replacing the value with the index number. It's
  // okay to lose the original value, because at runtime we always substitute
  // the source locale value anyway (because of variable scoping).
  //
  // For example, if some placeholders were reordered from [0 1 2] to [2 0 1],
  // then we'll generate a template like: html`foo ${2} bar ${0} baz ${1}`
  const placeholderOrder = new Map<string, number>(
    canon.contents
      .filter((value) => typeof value !== 'string')
      .map((placeholder, idx) => [
        (placeholder as Placeholder).untranslatable,
        idx,
      ])
  );

  const fragments = [];
  for (const content of contents) {
    if (typeof content === 'string') {
      fragments.push(escapeStringToEmbedInTemplateLiteral(content));
    } else {
      const template = parseStringAsTemplateLiteral(content.untranslatable);
      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        fragments.push(template.text);
      } else {
        fragments.push(template.head.text);
        for (const span of template.templateSpans) {
          // Substitute the value with the index (see note above).
          fragments.push(
            '${' + placeholderOrder.get(content.untranslatable) + '}'
          );
          fragments.push(span.literal.text);
        }
      }
    }
  }

  const tag = canon.isLitTemplate ? 'html' : '';
  return `${tag}\`${fragments.join('')}\``;
}
