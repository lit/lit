/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Message, ProgramMessage, Placeholder} from '../messages.js';
import {applyPatches, Patches} from '../patches.js';
import {writeLocaleCodesModule} from '../locales.js';
import type {Config} from '../types/config.js';
import type {RuntimeOutputConfig} from '../types/modes.js';
import {KnownError} from '../error.js';
import {
  escapeTextContentToEmbedInTemplateLiteral,
  parseStringAsTemplateLiteral,
} from '../typescript.js';
import fsExtra from 'fs-extra';
import * as pathLib from 'path';
import ts from 'typescript';
import {LitLocalizer} from '../index.js';
import type {Locale} from '../types/locale.js';

/**
 * Localizes a Lit project in runtime mode.
 */
export class RuntimeLitLocalizer extends LitLocalizer {
  config: Config & {output: RuntimeOutputConfig};

  constructor(config: Config & {output: RuntimeOutputConfig}) {
    super();
    if (config.output.mode !== 'runtime') {
      throw new Error(
        `Error: TransformLocalizer requires a localization config with output.mode "runtime"`
      );
    }
    this.config = config;
  }

  async build() {
    this.assertTranslationsAreValid();
    const {messages} = this.extractSourceMessages();
    const {translations} = this.readTranslationsSync();
    await runtimeOutput(
      messages,
      translations,
      this.config,
      this.config.output
    );
  }
}

/**
 * Write output for the `runtime` output mode.
 */
async function runtimeOutput(
  messages: ProgramMessage[],
  translationMap: Map<Locale, Message[]>,
  config: Config,
  runtimeConfig: RuntimeOutputConfig
) {
  let fileExtension;
  const language = runtimeConfig.language ?? (config.tsConfig ? 'ts' : 'js');
  switch (language) {
    case 'ts': {
      fileExtension = 'ts';
      break;
    }
    case 'js': {
      fileExtension = 'js';
      break;
    }
    default: {
      language as void;
    }
  }
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
      `Error creating locales directory: ${outputDir}\n` +
        `Do you have write permission?\n` +
        (e as Error).message
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
    const filename = pathLib.join(outputDir, `${locale}.${fileExtension}`);
    writes.push(
      fsExtra.writeFile(filename, ts, 'utf8').catch((e: unknown) => {
        throw new KnownError(
          `Error writing file: ${filename}\n` +
            `Do you have write permission?\n` +
            (e as Error).message
        );
      })
    );
  }
  await Promise.all(writes);
}

/**
 * Generate a <locale>.ts or <locale>.js module from the given bundle of
 * translated messages.
 *
 * TODO(aomarks) Refactor this into the build() method above.
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

  // Whether we need to import the lit html or localize str tags.
  let importLit = false;
  let importStr = false;

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
    if (msg.tag === 'html') {
      importLit = true;
    } else if (msg.tag === 'str') {
      importStr = true;
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

    ${importLit ? "import {html} from 'lit';" : ''}
    ${importStr ? "import {str} from '@lit/localize';" : ''}

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
 * Convert the contents of a message to a TypeScript string, possibly using lit
 * if there is embedded HTML.
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
  // then we'll generate a template like: html`foo ${2} bar ${0} baz ${1}`.
  //
  // This map provides the absolute index within a template for each expression
  // within the template. We identify each expression with the compound key
  // [placeholder id, relative expression index].
  //
  // Note that any given XLIFF/XLB <ph> placeholder can contain zero, one, or
  // many ${} expressions, so the index of the _placeholder_ is not the same as
  // the index of the _expression_:
  //
  //   <x equiv-text="&lt;a href='http://example.com/'&gt;"/>
  //   <x equiv-text="&lt;a href='${/*0*/ url}'&gt;"/>
  //   <x equiv-text="&lt;a href='${/*1*/ url}/${/*2*/ path}'&gt;"/>
  const placeholderOrder = new Map<string, number>();

  const placeholderOrderKey = (
    placeholder: Placeholder,
    placeholderRelativeExpressionIdx: number
  ) => JSON.stringify([placeholder.index, placeholderRelativeExpressionIdx]);

  let absIdx = 0;
  for (const content of canon.contents) {
    if (typeof content === 'string') {
      continue;
    }
    const template = parseStringAsTemplateLiteral(content.untranslatable);
    if (ts.isNoSubstitutionTemplateLiteral(template)) {
      continue;
    }
    for (let relIdx = 0; relIdx < template.templateSpans.length; relIdx++) {
      placeholderOrder.set(placeholderOrderKey(content, relIdx), absIdx++);
    }
  }

  const fragments = [];
  for (const content of contents) {
    if (typeof content === 'string') {
      fragments.push(escapeTextContentToEmbedInTemplateLiteral(content));
    } else {
      const template = parseStringAsTemplateLiteral(content.untranslatable);
      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        fragments.push(template.text);
      } else {
        fragments.push(template.head.text);
        for (let relIdx = 0; relIdx < template.templateSpans.length; relIdx++) {
          const absIdx: number = placeholderOrder.get(
            placeholderOrderKey(content, relIdx)
          )!;
          fragments.push('${' + absIdx + '}');
          fragments.push(template.templateSpans[relIdx].literal.text);
        }
      }
    }
  }

  return `${canon.tag ?? ''}\`${fragments.join('')}\``;
}
