import {
  getLitTemplateExpressions,
  hasAttributePart,
  parseLitTemplate,
  type LitTemplateAttribute,
} from '@lit-labs/analyzer/lib/lit/template.js';
import {type Element, traverse} from '@parse5/tools';
import type ts from 'typescript';
import {LitDiagnosticCode} from '../diagnostic-codes.js';
import type {LitLanguageService} from '../lit-language-service.js';

// TODO(justinfagnani): Make rule interface with a `name` property that can be
// used for error messages and configuration.

/**
 * Checks that no unbound attribute names start with a lit-html binding prefix.
 */
export const noBindingLikeAttributeNames = {
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
          element.attrs.forEach((attr) => {
            if (hasAttributePart(attr)) {
              // Has a lit binding, skip.
              return;
            }
            const {name} = attr;
            if (
              (name.startsWith('.') ||
                name.startsWith('@') ||
                name.startsWith('?')) &&
              (attr as LitTemplateAttribute).litPart === undefined
            ) {
              const location = element.sourceCodeLocation?.attrs?.[name];
              // +1 for the backtick character
              //
              // TODO(justinfagnani): is there another node we can get the start
              // from?
              // TODO(justinfagnani): Fix up the source locations even better
              // (relative to the sourceFile) or make a utility function for
              // this.
              const templateStart =
                (typescript.isNoSubstitutionTemplateLiteral(tsNode.template)
                  ? tsNode.template.getStart()
                  : tsNode.template.head.getStart()) + 1;
              const start = templateStart + (location?.startOffset ?? 0);
              const end = start + name.length;
              const length = end - start;
              const source = sourceFile.getFullText().slice(start, end);
              diagnostics.push({
                source,
                category: typescript.DiagnosticCategory.Warning,
                code: LitDiagnosticCode.BindingLikeAttributeName,
                file: sourceFile,
                start,
                length,
                messageText: `Attribute name starts with a binding prefix (${name.charAt(0)})`,
              });
            }
          });
        },
      });
    }
    return diagnostics;
  },
};
