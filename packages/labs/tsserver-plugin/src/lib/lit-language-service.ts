import {Analyzer} from '@lit-labs/analyzer';
import {
  isLitHtmlTaggedTemplateExpression,
  parseLitTemplate,
} from '@lit-labs/analyzer/lib/lit/template.js';
import * as path from 'node:path';
import type ts from 'typescript';
import {Diagnostic, LanguageService} from 'typescript';
import {noBindingLikeAttributeNames} from './rules/no-binding-like-attribute-names.js';
import {noUnassignablePropertyBindings} from './rules/no-unassignable-property-bindings.js';
import {type Element, traverse} from '@parse5/tools';

const rules = [noBindingLikeAttributeNames, noUnassignablePropertyBindings];

/**
 * Initialized a Lit language service onto the given language service instance,
 * which is assumed to already extend another language service via its
 * prototype.
 *
 * Performs some prototype swizzling to make the new language service have a
 * LitLanguageService prototype, which intern has the original language service
 * as its prototype.
 */
export const makeLitLanguageService = (
  instance: LanguageService,
  info: ts.server.PluginCreateInfo,
  typescript: typeof ts
) => {
  /**
   * This class returns the inner language service from the constructor so that
   * it'll become the prototype of the instance, all of the original language
   * service methods will be inherited, and let us use `this` and `super` to
   * call the original language service methods.
   */
  const InnerLanguageService = class {
    constructor() {
      return instance;
    }
  } as new () => LanguageService;

  /**
   * A language service that provides diagnostics for Lit modules.
   */
  class LitLanguageService extends InnerLanguageService {
    #analyzer: Analyzer;

    constructor(_info: ts.server.PluginCreateInfo, typescript: typeof ts) {
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
                  const elementType = this.getElementClassType(element.tagName);
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

    getElementClassType(tagname: string): ts.Type | undefined {
      const checker = this.#analyzer.program.getTypeChecker();
      // Use the type checker to get the symbol for the ambient/global
      // HTMLElementTagNameMap type.
      const tagNameMapSymbol = checker.resolveName(
        'HTMLElementTagNameMap',
        undefined,
        typescript.SymbolFlags.Interface,
        false
      );

      if (tagNameMapSymbol !== undefined) {
        const tagNameMapType =
          checker.getDeclaredTypeOfSymbol(tagNameMapSymbol);
        const propertySymbol = checker.getPropertyOfType(
          tagNameMapType,
          tagname
        );

        if (propertySymbol?.valueDeclaration) {
          // We found the property on HTMLElementTagNameMap, like `div: HTMLDivElement`.
          // Now we need to get the type of that property.
          return checker.getTypeOfSymbolAtLocation(
            propertySymbol,
            propertySymbol.valueDeclaration
          );
        }
      }
      return undefined;
    }
  }

  // Set up the prototype chain to be:
  // instance -> InnerLanguageService.prototype -> instance.__proto__
  const innerLanguageService = Object.getPrototypeOf(instance);
  Object.setPrototypeOf(instance, LitLanguageService.prototype);
  Object.setPrototypeOf(LitLanguageService.prototype, innerLanguageService);

  return new LitLanguageService(info, typescript);
};
export type LitLanguageService = ReturnType<typeof makeLitLanguageService>;
