/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {DiagnosticCode} from './diagnostic-code.js';

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

interface DiagnosticOptions {
  node: ts.Node;
  message?: string | undefined;
  category?: ts.DiagnosticCategory;
  code?: DiagnosticCode | undefined;
}

export const createDiagnostic = ({
  node,
  message,
  category,
  code,
}: DiagnosticOptions) => {
  return {
    file: node.getSourceFile(),
    start: node.getStart(),
    length: node.getWidth(),
    category: category ?? ts.DiagnosticCategory.Error,
    code: code ?? DiagnosticCode.UNKNOWN,
    messageText: message ?? '',
  };
};

export const logDiagnostics = (diagnostics: Array<ts.Diagnostic>) => {
  if (diagnostics.length > 0) {
    console.log(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost)
    );
  }
};

export class DiagnosticsError extends Error {
  diagnostics: ts.Diagnostic[];
  constructor(diagnostics: readonly ts.Diagnostic[], message?: string);
  constructor(node: ts.Node, message: string);
  constructor(
    readonly nodeOrDiagnostics: readonly ts.Diagnostic[] | ts.Node,
    message?: string
  ) {
    let diagnostics;
    if (Array.isArray(nodeOrDiagnostics)) {
      diagnostics = nodeOrDiagnostics;
    } else {
      const node = nodeOrDiagnostics as ts.Node;
      diagnostics = [createDiagnostic({node, message})];
      message = undefined;
    }
    super(
      (message ? message + ':\n' : '') +
        ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost)
    );
    this.diagnostics = diagnostics;
  }
}
