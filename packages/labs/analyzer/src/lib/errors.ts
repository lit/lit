/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type ts from 'typescript';
import {DiagnosticCode} from './diagnostic-code.js';

export type TypeScript = typeof ts;

export interface DiagnosticOptions {
  typescript: TypeScript;
  node: ts.Node;
  message: string;
  category?: ts.DiagnosticCategory;
  code?: DiagnosticCode | undefined;
}

export const createDiagnostic = ({
  typescript,
  node,
  message,
  category,
  code,
}: DiagnosticOptions) => {
  return {
    file: node.getSourceFile(),
    start: node.getStart(),
    length: node.getWidth(),
    category: category ?? typescript.DiagnosticCategory.Error,
    code: code ?? DiagnosticCode.UNKNOWN,
    messageText: message ?? '',
  };
};
