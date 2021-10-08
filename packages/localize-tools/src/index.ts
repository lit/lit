/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import type {Config} from './types/config.js';
import {
  ProgramMessage,
  Message,
  sortProgramMessages,
  validateLocalizedPlaceholders,
} from './messages.js';
import {readTsConfig} from './typescript.js';
import {extractMessagesFromProgram} from './program-analysis.js';
import {Formatter, makeFormatter} from './formatters/index.js';
import fastGlob from 'fast-glob';
import {KnownError} from './error.js';
import type {Locale} from './types/locale.js';

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
 *
 * TODO(aomarks) This set of classes is probably too monolithic. Let's split
 * things up into Extractor, Builders, and Formatters classes (actually
 * Formatter already exists, but it needs a better name).
 */
export abstract class LitLocalizer {
  protected abstract config: Config;

  /* Lazily cached assets */
  private _program?: ts.Program;
  private _formatter?: Formatter;
  private _sourceMessages?: ExtractMessagesResult;
  private _translations?: ReadTranslationsResult;
  private _filesAndCompilerOptions?: {
    fileNames: string[];
    options: ts.CompilerOptions;
  };

  /**
   * A TypeScript program for this project.
   */
  protected get program(): ts.Program {
    if (!this._program) {
      const {fileNames, options} = this.filesAndCompilerOptions;
      this._program = ts.createProgram(fileNames, options);
    }
    return this._program;
  }

  private get filesAndCompilerOptions() {
    if (!this._filesAndCompilerOptions) {
      if (this.config.tsConfig) {
        this._filesAndCompilerOptions = readTsConfig(
          this.config.resolve(this.config.tsConfig)
        );
      } else if (!this.config.inputFiles) {
        throw new KnownError(
          `At least one of inputFiles or tsConfig must be specified.`
        );
      } else {
        this._filesAndCompilerOptions = {
          fileNames: [],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            experimentalDecorators: true,
            lib: ['esnext', 'dom'],
            allowJs: true,
          },
        };
      }
      if (this.config.inputFiles) {
        this._filesAndCompilerOptions.fileNames = fastGlob.sync(
          this.config.inputFiles,
          {
            cwd: this.config.baseDir,
            absolute: true,
          }
        );
      }
    }
    return this._filesAndCompilerOptions;
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
   *
   * TODO(aomarks) Add an async version. This is synchronous as a conceit to our
   * Rollup integration, because
   * @rollup/typescript-plugin runs tsc in the Rollup buildStart hook, which we
   * cannot preempt because that is the earliest hook, and they run in parallel
   * (see https://github.com/rollup/rollup/issues/2826). We'd prefer to read
   * translation files in parallel when we can.
   */
  readTranslationsSync(): ReadTranslationsResult {
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
    const {translations} = this.readTranslationsSync();
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
    const {translations} = this.readTranslationsSync();
    const sorted = sortProgramMessages([...messages]);
    await this.formatter.writeOutput(sorted, translations);
  }

  /**
   * Build the project. Behavior depends on output.mode setting.
   */
  abstract build(): Promise<void>;
}
