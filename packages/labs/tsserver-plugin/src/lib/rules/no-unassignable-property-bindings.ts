import {
  getLitTemplateExpressions,
  parseLitTemplate,
} from '@lit-labs/analyzer/lib/lit/template.js';
import {traverse, type Element} from '@parse5/tools';
import {
  PartType,
  hasAttributePart,
} from '@lit-labs/analyzer/lib/lit/template.js';
import type ts from 'typescript';
import type {LitLanguageService} from '../lit-language-service.js';

/**
 * TEMP: Placeholder rule for type checking property bindings.
 * For now it simply reports a diagnostic on every property binding it finds
 * (attributes whose name starts with '.'). We'll refine the logic in follow-up
 * changes to actually validate assignability.
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
            // If there are more than two strings, or if either of the strings
            // are not empty string, then the type of the right hand side is
            // 'string'.
            let rightHandSideType: ts.Type;
            if (part.strings.length > 2 || part.strings.some((s) => s !== '')) {
              throw new Error('todo: get/construct the `string` type');
            } else {
              if (part.expressions.length !== 1) {
                throw new Error(
                  'InternalError: Expected exactly one expression'
                );
              }
              const rhsExpression: ts.Expression = part.expressions[0];
              rightHandSideType = checker.getTypeAtLocation(rhsExpression);
            }
            // get the type of the left hand side
            const elementType = litLanguageService.getElementClassType(
              element.tagName
            );
            if (elementType === undefined) {
              // Unknown element. Other rules will warn in this case.
              continue;
            }

            const propertySymbol = elementType.getProperty(part.name);
            if (
              propertySymbol == null ||
              propertySymbol.valueDeclaration == null
            ) {
              const location = element.sourceCodeLocation?.attrs?.[attr.name];
              const templateStart =
                (typescript.isNoSubstitutionTemplateLiteral(tsNode.template)
                  ? tsNode.template.getStart()
                  : tsNode.template.head.getStart()) + 1; // +1 for backtick
              const start = templateStart + (location?.startOffset ?? 0);
              const end = templateStart + (location?.endOffset ?? 0);
              const length = end - start;
              diagnostics.push({
                category: typescript.DiagnosticCategory.Error,
                code: 6303, // distinct from 6301 used elsewhere
                file: sourceFile,
                start,
                length,
                messageText: `Unknown property ${JSON.stringify(part.name)} on element <${element.tagName}>`,
              });
              continue;
            }

            const propertyType = checker.getTypeAtLocation(
              propertySymbol.valueDeclaration
            );

            const isAssignable = checker.isTypeAssignableTo(
              rightHandSideType,
              propertyType
            );

            if (isAssignable) {
              continue;
            }

            const {name} = attr;
            const location = element.sourceCodeLocation?.attrs?.[name];
            const templateStart =
              (typescript.isNoSubstitutionTemplateLiteral(tsNode.template)
                ? tsNode.template.getStart()
                : tsNode.template.head.getStart()) + 1; // +1 for backtick
            const start = templateStart + (location?.startOffset ?? 0);
            const end = templateStart + (location?.endOffset ?? 0);
            const length = end - start;
            diagnostics.push({
              category: typescript.DiagnosticCategory.Error,
              code: 6302, // distinct from 6301 used elsewhere
              file: sourceFile,
              start,
              length,
              messageText: '(placeholder) Property binding',
            });
          }
        },
      });
    }
    return diagnostics;
  },
};
