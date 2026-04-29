import {Analyzer} from '@lit-labs/analyzer';
import {
  isLitHtmlTaggedTemplateExpression,
  parseLitTemplate,
} from '@lit-labs/analyzer/lib/lit/template.js';
import {type Element, traverse} from '@parse5/tools';
import * as path from 'node:path';
import type ts from 'typescript';
import {Diagnostic, LanguageService} from 'typescript';
import {noBindingLikeAttributeNames} from './rules/no-binding-like-attribute-names.js';
import {noUnassignablePropertyBindings} from './rules/no-unassignable-property-bindings.js';
import {noInvalidElementBindings} from './rules/no-invalid-element-bindings.js';
import {getElementClassType} from './type-helpers/get-element-class.js';

const rules = [
  noBindingLikeAttributeNames,
  noUnassignablePropertyBindings,
  noInvalidElementBindings,
];

/**
 * Initialize a Lit language service onto the given language service instance,
 * which is assumed to already extend another language service via its
 * prototype.
 *
 * Performs some prototype swizzling to make the new language service have a
 * LitLanguageService prototype, which intern has the original language service
 * as its prototype.
 */
export const makeLitLanguageService = (
  info: ts.server.PluginCreateInfo,
  typescript: typeof ts
) => {
  /**
   * This class tricks TypeScript into thinking that we're extending a
   * LanguageService class and makes LitLanguageService's prototype inherit from
   * the innerLanguageService.
   */
  const InnerLanguageService = function (this: LanguageService) {
    return this as LanguageService;
  } as unknown as {new (): LanguageService};
  // Set up the prototype chain of our LitLanguageService instance to be:
  // instance -> LitLanguageService.prototype -> innerLanguageService
  InnerLanguageService.prototype = info.languageService;

  /**
   * A language service that provides diagnostics for Lit modules.
   */
  class LitLanguageService extends InnerLanguageService {
    #analyzer: Analyzer;

    constructor(typescript: typeof ts) {
      super();
      this.#analyzer = new Analyzer({
        typescript,
        getProgram: () => this.getProgram()!,
        fs: typescript.sys,
        path,
      });
    }

    override getSemanticDiagnostics(
      ...args: Parameters<LanguageService['getSemanticDiagnostics']>
    ): Diagnostic[] {
      const [fileName] = args;
      const sourceFile = this.getProgram()!.getSourceFile(fileName)!;
      const prevDiagnostics = super.getSemanticDiagnostics?.(...args);
      const diagnostics: Diagnostic[] = [];

      for (const rule of rules) {
        diagnostics.push(
          ...rule.getSemanticDiagnostics(
            sourceFile,
            this.#analyzer.typescript,
            this.#analyzer.program.getTypeChecker(),
            this
          )
        );
      }
      // TODO(justinfagnani): Add in analyzer diagnostics
      return [...(prevDiagnostics ?? []), ...diagnostics];
    }

    override getDefinitionAtPosition(
      fileName: string,
      position: number
    ): readonly ts.DefinitionInfo[] | undefined {
      const program = this.getProgram()!;
      const checker = program.getTypeChecker();
      const sourceFile = program.getSourceFile(fileName)!;

      const tsNode = this.#findNodeAtPosition(sourceFile!, position);
      if (tsNode !== undefined && typescript.isTemplateLiteral(tsNode)) {
        if (
          isLitHtmlTaggedTemplateExpression(tsNode.parent, typescript, checker)
        ) {
          const litTemplate = parseLitTemplate(
            tsNode.parent,
            typescript,
            checker
          );

          // Get the Lit template node at this position
          const templatePosition = tsNode.getFullStart();
          let foundDefinition: ts.DefinitionInfo | undefined;

          traverse(litTemplate, {
            element: (element: Element) => {
              const {startTag} = element.sourceCodeLocation!;
              if (
                startTag !== undefined &&
                startTag.startOffset + templatePosition < position &&
                startTag.endOffset + templatePosition > position
              ) {
                const definition = this.#getElementDefinition(element.tagName);
                if (definition !== undefined) {
                  const tsDefinition = definition.node;

                  // Get a ts.DefinitionInfo from this tsDefinition
                  const sourceFile = tsDefinition.getSourceFile();
                  const start = tsDefinition.getStart();
                  const length = tsDefinition.getEnd() - start;

                  foundDefinition = {
                    fileName: sourceFile.fileName,
                    textSpan: {start, length},
                    kind: typescript.ScriptElementKind.classElement,
                    name: definition.name,
                    containerKind: typescript.ScriptElementKind.moduleElement,
                    containerName: '',
                  };
                } else {
                  const elementType = getElementClassType(
                    element.tagName,
                    checker,
                    typescript
                  );
                  // Get the declaration from the element's type.
                  const classDeclaration =
                    elementType?.getSymbol()?.valueDeclaration;

                  if (classDeclaration !== undefined) {
                    const sourceFile = classDeclaration.getSourceFile();
                    const start = classDeclaration.getStart();
                    const length = classDeclaration.getEnd() - start;
                    foundDefinition = {
                      fileName: sourceFile.fileName,
                      textSpan: {start, length},
                      kind: typescript.ScriptElementKind.classElement,
                      name: classDeclaration.getText(),
                      containerKind: typescript.ScriptElementKind.moduleElement,
                      containerName: '',
                    };
                  }
                }
              }
            },
          });

          if (foundDefinition) {
            return [foundDefinition];
          }
        }
      }

      return super.getDefinitionAtPosition(fileName, position);
    }

    override getDefinitionAndBoundSpan(
      fileName: string,
      position: number
    ): ts.DefinitionInfoAndBoundSpan | undefined {
      console.log('getDefinitionAndBoundSpan', fileName, position);
      return super.getDefinitionAndBoundSpan(fileName, position);
    }

    override getQuickInfoAtPosition(
      fileName: string,
      position: number
    ): ts.QuickInfo | undefined {
      const program = this.getProgram()!;
      const checker = program.getTypeChecker();
      const sourceFile = program.getSourceFile(fileName)!;

      const tsNode = this.#findNodeAtPosition(sourceFile!, position);
      if (tsNode !== undefined && typescript.isTemplateLiteral(tsNode)) {
        if (
          isLitHtmlTaggedTemplateExpression(tsNode.parent, typescript, checker)
        ) {
          const litTemplate = parseLitTemplate(
            tsNode.parent,
            typescript,
            checker
          );

          // Get the Lit template node at this position
          const templatePosition = tsNode.getFullStart();
          let quickInfo: ts.QuickInfo | undefined;

          traverse(litTemplate, {
            element: (element: Element) => {
              const {startTag} = element.sourceCodeLocation!;
              if (
                startTag !== undefined &&
                startTag.startOffset + templatePosition < position &&
                startTag.endOffset + templatePosition > position
              ) {
                const definition = this.#getElementDefinition(element.tagName);
                // TODO(kschaaf): This doesn't seem to work, but would be better to be
                // able to super to the original language service's quickInfo for the
                // class declaration; for now make a new quick info using the docs found
                // in the analyzer.
                // const definitionSourceFile =
                //   definition?.node.getSourceFile().fileName;
                // const definitionPos = definition?.node.getFullStart() ?? 0;
                // if (definitionSourceFile !== undefined) {
                //   quickInfo = super.getQuickInfoAtPosition(
                //     definitionSourceFile,
                //     definitionPos
                //   );
                // }
                if (definition !== undefined) {
                  quickInfo = {
                    kind: typescript.ScriptElementKind.label,
                    textSpan: {
                      start: templatePosition + startTag.startOffset,
                      length: startTag.endOffset - startTag.startOffset,
                    },
                    kindModifiers: '',
                    displayParts: [
                      {
                        kind: 'text',
                        // TODO: This may get formatted weird, haven't figured out
                        // the right fields of QuickInfo to use.
                        text: `Lit Element <${definition.tagname}>${definition.description ? ':\n' + definition.description : ''}`,
                      },
                    ],
                  };
                }
              }
            },
          });

          if (quickInfo) {
            return quickInfo;
          }
        }
      }
      return super.getQuickInfoAtPosition(fileName, position);
    }

    /**
     * Find the TypeScript AST node at the given position using depth-first traversal.
     */
    #findNodeAtPosition(
      sourceFile: ts.SourceFile,
      position: number
    ): ts.Node | undefined {
      function find(node: ts.Node): ts.Node | undefined {
        // Check if position is within this node's range
        if (position >= node.getFullStart() && position < node.getEnd()) {
          // Try to find a more specific child node first
          let foundChild: ts.Node | undefined;
          node.forEachChild((child) => {
            if (!foundChild) {
              foundChild = find(child);
            }
          });
          // Return the most specific node found, or this node if no children match
          return foundChild || node;
        }
        return undefined;
      }

      return find(sourceFile);
    }

    #getElementDefinition(tagname: string) {
      const pkg = this.#analyzer.getPackage();
      for (const module of pkg.modules) {
        const customElementExports = module.getCustomElementExports();
        for (const ce of customElementExports) {
          if (ce.tagname === tagname) {
            return ce;
          }
        }
      }
      return undefined;
    }
  }

  return new LitLanguageService(typescript);
};

export type LitLanguageService = ReturnType<typeof makeLitLanguageService>;
