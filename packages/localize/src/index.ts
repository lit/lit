/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {Config} from './config';
import {
  ProgramMessage,
  Message,
  sortProgramMessages,
  validateLocalizedPlaceholders,
} from './messages';
import {programFromTsConfig} from './typescript';
import {extractMessagesFromProgram} from './program-analysis';
import {Formatter, makeFormatter} from './formatters';
import {Locale} from './locales';

interface ExtractMessagesResult {
  messages: Array<ProgramMessage>;
  errors: ts.Diagnostic[];
}

interface ReadTranslationsResult {
  translations: Map<Locale, Array<Message>>;
}

interface ValidateTranslationsResult {
  errors: string[];
}

/**
 * Abstract base class for programmatic access to @lit/localize. Use one of the
 * concrete classes: TransformLitLocalizer, RuntimeLitLocalizer.
 */
export abstract class LitLocalizer {
  protected abstract config: Config;

  /* Lazily cached assets */
  private _program?: ts.Program;
  private _formatter?: Formatter;
  private _sourceMessages?: ExtractMessagesResult;
  private _translations?: ReadTranslationsResult;

  /**
   * A TypeScript program for this project.
   */
  protected get program(): ts.Program {
    if (!this._program) {
      this._program = programFromTsConfig(
        this.config.resolve(this.config.tsConfig)
      );
    }
    return this._program;
  }

  /**
   * A formatter for reading/writing translation files in the format configured
   * by this project (e.g. XLIFF).
   */
  protected get formatter(): Formatter {
    if (!this._formatter) {
      this._formatter = makeFormatter(this.config);
    }
    return this._formatter;
  }

  /**
   * Analyze the source files of this project and return all extracted `msg`
   * calls.
   */
  extractSourceMessages(): {
    messages: Array<ProgramMessage>;
    errors: ts.Diagnostic[];
  } {
    if (!this._sourceMessages) {
      this._sourceMessages = extractMessagesFromProgram(this.program);
    }
    return this._sourceMessages;
  }

  /**
   * Read translated messages from this project's translation files (e.g. XLIFF)
   * files into a Map keyed by locale ID.
   */
  readTranslations(): ReadTranslationsResult {
    if (!this._translations) {
      const localeMessagesMap = new Map<Locale, Array<Message>>();
      for (const bundle of this.formatter.readTranslations()) {
        localeMessagesMap.set(bundle.locale, bundle.messages);
      }
      this._translations = {translations: localeMessagesMap};
    }
    return this._translations;
  }

  /**
   * Check that all translations are valid given the current set of source
   * messages.
   */
  validateTranslations(): ValidateTranslationsResult {
    const {translations} = this.readTranslations();
    const {messages} = this.extractSourceMessages();
    const placeholderErrors = validateLocalizedPlaceholders(
      messages,
      translations
    );
    return {
      errors: placeholderErrors,
    };
  }

  /**
   * Throw if there are any errors in translations.
   */
  assertTranslationsAreValid() {
    const {errors} = this.validateTranslations();
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  }

  /**
   * Create or update translation data (e.g. XLIFF files).
   */
  async writeInterchangeFiles(): Promise<void> {
    const {messages} = this.extractSourceMessages();
    const {translations} = this.readTranslations();
    const sorted = sortProgramMessages([...messages]);
    await this.formatter.writeOutput(sorted, translations);
  }

  /**
   * Build the project. Behavior depends on output.mode setting.
   */
  abstract async build(): Promise<void>;
}
