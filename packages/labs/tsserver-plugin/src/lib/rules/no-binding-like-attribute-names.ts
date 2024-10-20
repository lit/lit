import {
  getLitTemplateExpressions,
  parseLitTemplate,
} from '@lit-labs/analyzer/lib/lit-html/template.js';
import {type Element, traverse} from '@parse5/tools';
import type ts from 'typescript';

// TODO(justinfagnani): Make rule interface with a `name` property that can be
// used for error messages and configuration.
export const noBindingLikeAttributeNames = {
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
          element.attrs.forEach((attr) => {
            const {name} = attr;
            if (
              name.startsWith('.') ||
              name.startsWith('@') ||
              name.startsWith('?')
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
              const end = templateStart + (location?.endOffset ?? 0);
              const length = end - start;
              const source = sourceFile.getFullText().slice(start, end);
              diagnostics.push({
                source,
                category: typescript.DiagnosticCategory.Warning,
                // random-ish number. How are we supposed to pick these?
                code: 6301,
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
