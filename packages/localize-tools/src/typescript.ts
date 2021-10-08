/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import * as path from 'path';
import {KnownError} from './error.js';

/**
 * Read and parse a tsconfig.json file, including expanding its file patterns
 * into a list of files.
 */
export function readTsConfig(tsConfigPath: string): {
  fileNames: string[];
  options: ts.CompilerOptions;
} {
  const {config, error} = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) {
    // TODO(aomarks) Set up proper TypeScript diagnostics reporting here too.
    throw new KnownError(JSON.stringify(error));
  }
  const {errors, fileNames, options} = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(tsConfigPath)
  );
  if (errors.length > 0) {
    throw new KnownError(
      errors.map((error) => JSON.stringify(error)).join('\n')
    );
  }
  return {fileNames, options};
}

/**
 * Create a TypeScript diagnostic object for error reporting.
 */
export function createDiagnostic(
  file: ts.SourceFile,
  node: ts.Node,
  message: string,
  relatedInformation?: ts.DiagnosticRelatedInformation[]
): ts.DiagnosticWithLocation {
  return {
    file,
    start: node.getStart(file),
    length: node.getWidth(file),
    category: ts.DiagnosticCategory.Error,
    code: 2324, // Fairly meaningless but reasonably unique number.
    messageText: message,
    source: 'localization-generate',
    relatedInformation,
  };
}

/**
 * Create a nice string for the given TypeScript diagnostic objects.
 */
export function stringifyDiagnostics(diagnostics: ts.Diagnostic[]): string {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName(name: string) {
      return name;
    },
    getCurrentDirectory() {
      return process.cwd();
    },
    getNewLine() {
      return '\n';
    },
  });
}

/**
 * Nicely log an error for the given TypeScript diagnostic objects.
 */
export function printDiagnostics(diagnostics: ts.Diagnostic[]): void {
  console.error(stringifyDiagnostics(diagnostics));
}

/**
 * Escape an HTML text content string such that it can be safely embedded in a
 * JavaScript template literal (backtick string).
 */
export function escapeTextContentToEmbedInTemplateLiteral(
  unescaped: string
): string {
  return unescaped
    .replace(/\\/g, `\\\\`)
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Parse the given string as though it were the body of a template literal
 * (backticks should not be included), and return its TypeScript AST node
 * representation.
 */
export function parseStringAsTemplateLiteral(
  templateLiteralBody: string
): ts.TemplateLiteral {
  const file = ts.createSourceFile(
    '__DUMMY__.ts',
    '`' + templateLiteralBody + '`',
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.JS
  );
  if (file.statements.length !== 1) {
    throw new Error('Internal error: expected 1 statement');
  }
  const statement = file.statements[0];
  if (!ts.isExpressionStatement(statement)) {
    throw new Error('Internal error: expected expression statement');
  }
  const expression = statement.expression;
  if (!ts.isTemplateLiteral(expression)) {
    throw new Error('Internal error: expected template literal expression');
  }
  return expression;
}
