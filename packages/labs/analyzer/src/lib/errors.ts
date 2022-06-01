/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

const diagnosticsHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName(name: string) {
    return name;
  },
  getCurrentDirectory() {
    return process.cwd();
  },
  getNewLine() {
    return '\n';
  },
};

export class DiagnosticsError extends Error {
  constructor(diagnostics: readonly ts.Diagnostic[], message?: string) {
    super(
      (message ? message + ':\n' : '') +
        ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost)
    );
  }
}

export class DiagnosticError extends Error {
  constructor(node: ts.Node, message: string) {
    const diagnostics = [
      {
        file: node.getSourceFile(),
        start: node.getStart(),
        length: node.getWidth(),
        category: ts.DiagnosticCategory.Error,
        code: 2323,
        messageText: message ?? '',
      },
    ];
    super(
      message +
        ':\n' +
        ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost)
    );
  }
}
