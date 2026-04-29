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
import {getLitExpressionType} from '../type-helpers/lit-expression-type.js';
import {
  getElementClassType,
  getHTMLElementType,
} from '../type-helpers/get-element-class.js';

/**
 * Type check property bindings. Gives an error if the property can't be found
 * on the element, or if the expression is not assignable to the property type.
 *
 * Handles all the tricky cases, like `noChange`, `nothing`, and directives,
 * provided that the directives are typed with enough information to infer
 * the correct type of the directive class's `render` method.
 */
export const noUnassignablePropertyBindings = {
  getSemanticDiagnostics(
    sourceFile: ts.SourceFile,
    typescript: typeof ts,
    checker: ts.TypeChecker,
    litLanguageService: LitLanguageService
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
            if (part.type !== PartType.PROPERTY) {
              continue;
            }
            let rightHandSideType: ts.Type;
            // If there are more than two strings, or if either of the strings
            // are not empty string, then the type of the right hand side is
            // 'string'.
            if (part.strings.length > 2 || part.strings.some((s) => s !== '')) {
              rightHandSideType = checker.getStringType();
            } else {
              if (part.expressions.length !== 1) {
                throw new Error(
                  `InternalError: Expected exactly one expression but got ${part.expressions.length} in a property binding to ${attr.name} on a <${element.tagName}>`
                );
              }
              const rhsExpression: ts.Expression = part.expressions[0];
              rightHandSideType = getLitExpressionType(
                checker.getTypeAtLocation(rhsExpression),
                typescript,
                litLanguageService.getProgram()!
              );
            }
            // get the type of the left hand side
            let elementType = getElementClassType(
              element.tagName,
              checker,
              typescript
            );
            if (elementType === undefined) {
              // Unknown element. Type check as an HTMLElement, which is
              // their runtime type.
              elementType = getHTMLElementType(checker, typescript);
              if (elementType === undefined) {
                // Probably no lib.dom.d.ts in this program.
                continue;
              }
            }

            const propertySymbol = elementType.getProperty(part.name);
            if (
              propertySymbol == null ||
              propertySymbol.valueDeclaration == null
            ) {
              const location = element.sourceCodeLocation?.attrs?.[attr.name];
              const templateStart =
                (typescript.isNoSubstitutionTemplateLiteral(tsNode.template)
                  ? tsNode.template.getFullStart()
                  : tsNode.template.head.getFullStart()) + 1; // +1 for backtick
              const start = templateStart + (location?.startOffset ?? 0);
              const end = templateStart + (location?.endOffset ?? 0);
              const length = end - start;
              diagnostics.push({
                category: typescript.DiagnosticCategory.Error,
                code: LitDiagnosticCode.UnknownProperty,
                file: sourceFile,
                start,
                length,
                messageText: `Unknown property ${JSON.stringify(part.name)} on element <${element.tagName}>`,
              });
              continue;
            }

            const leftHandSide = checker.getTypeAtLocation(
              propertySymbol.valueDeclaration
            );

            const isAssignable = checker.isTypeAssignableTo(
              rightHandSideType,
              leftHandSide
            );

            if (isAssignable) {
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
              code: LitDiagnosticCode.UnassignablePropertyBinding,
              file: sourceFile,
              start,
              length,
              messageText: `'${checker.typeToString(rightHandSideType)}' is not assignable to '${checker.typeToString(leftHandSide)}'`,
            });
          }
        },
      });
    }
    return diagnostics;
  },
};
