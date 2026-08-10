/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  getLitTemplateExpressions,
  parseLitTemplate,
} from '@lit-labs/analyzer/lib/lit/template.js';
import {traverse, type Element} from '@parse5/tools';
import {
  PartType,
  hasAttributePart,
} from '@lit-labs/analyzer/lib/lit/template.js';
import type * as ts from 'typescript';
import {LitDiagnosticCode} from '../diagnostic-codes.js';
import type {LitLanguageService} from '../lit-language-service.js';
import {
  isSpecialValue,
  SpecialValuesEnum,
} from '../type-helpers/lit-expression-type.js';

/**
 * Element bindings must be DirectiveResults, or any.
 */
export const noInvalidElementBindings = {
  getSemanticDiagnostics(
    sourceFile: ts.SourceFile,
    typescript: typeof ts,
    checker: ts.TypeChecker,
    _litLanguageService: LitLanguageService
  ) {
    const diagnostics: ts.Diagnostic[] = [];
    const templates = getLitTemplateExpressions(
      sourceFile,
      typescript,
      checker
    );
    for (const template of templates) {
      const litTemplate = parseLitTemplate(template, typescript, checker);
      const {tsNode} = litTemplate;

      traverse(litTemplate, {
        element(element: Element) {
          for (const attr of element.attrs) {
            if (!hasAttributePart(attr)) {
              continue;
            }
            const part = attr.litPart;
            if (part.type !== PartType.ELEMENT) {
              continue;
            }
            const type = checker.getTypeAtLocation(part.expression);
            if (type.flags & typescript.TypeFlags.Any) {
              // We allow the 'any' type.
              continue;
            }
            if (
              isSpecialValue(type, typescript) ===
              SpecialValuesEnum.DirectiveResult
            ) {
              continue;
            }

            const {name} = attr;
            const location = element.sourceCodeLocation?.attrs?.[name];
            const templateStart =
              (typescript.isNoSubstitutionTemplateLiteral(tsNode.template)
                ? tsNode.template.getFullStart()
                : tsNode.template.head.getFullStart()) + 1; // +1 for backtick
            const start = templateStart + (location?.startOffset ?? 0);
            const end = templateStart + (location?.endOffset ?? 0);
            const length = end - start;
            diagnostics.push({
              category: typescript.DiagnosticCategory.Error,
              code: LitDiagnosticCode.ElementBindingNotDirectiveResult,
              file: sourceFile,
              start,
              length,
              messageText: `Only DirectiveResults may be used in element-level bindings, but found '${checker.typeToString(type)}' in binding to <${element.tagName}>`,
            });
          }
        },
      });
    }
    return diagnostics;
  },
};
