/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import * as path from 'path';
import {KnownError} from './error';

/**
 * Set up a TypeScript API program given a tsconfig.json filepath.
 */
export function programFromTsConfig(tsConfigPath: string): ts.Program {
  const {config, error} = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) {
    // TODO(aomarks) Set up proper TypeScript diagnostics reporting here too.
    throw new KnownError(JSON.stringify(error));
  }
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(tsConfigPath)
  );
  if (parsedCommandLine.errors.length > 0) {
    throw new KnownError(
      parsedCommandLine.errors.map((error) => JSON.stringify(error)).join('\n')
    );
  }
  const {fileNames, options} = parsedCommandLine;
  const program = ts.createProgram(fileNames, options);
  return program;
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
 * Nicely log an error for the given TypeScript diagnostic object.
 */
export function printDiagnostics(diagnostics: ts.Diagnostic[]): void {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName(name: string) {
        return name;
      },
      getCurrentDirectory() {
        return process.cwd();
      },
      getNewLine() {
        return '\n';
      },
    })
  );
}

/**
 * Escape a string such that it can be safely embedded in a JavaScript template
 * literal (backtick string).
 */
export function escapeStringToEmbedInTemplateLiteral(
  unescaped: string
): string {
  return unescaped
    .replace(/\\/g, `\\\\`)
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}
