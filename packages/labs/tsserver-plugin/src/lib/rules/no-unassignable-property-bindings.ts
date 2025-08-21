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
    checker: ts.TypeChecker
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

            const {name} = attr;
            const location = element.sourceCodeLocation?.attrs?.[name];
            const templateStart =
              (typescript.isNoSubstitutionTemplateLiteral(tsNode.template)
                ? tsNode.template.getStart()
                : tsNode.template.head.getStart()) + 1; // +1 for backtick
            const start = templateStart + (location?.startOffset ?? 0);
            const end = templateStart + (location?.endOffset ?? 0);
            const length = end - start;
            const source = sourceFile.getFullText().slice(start, end);
            diagnostics.push({
              source,
              category: typescript.DiagnosticCategory.Warning,
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
