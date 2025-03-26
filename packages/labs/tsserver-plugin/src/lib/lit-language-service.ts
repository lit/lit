import {Analyzer} from '@lit-labs/analyzer';
import * as path from 'node:path';
import type ts from 'typescript';
import {Diagnostic, LanguageService} from 'typescript';
import {noBindingLikeAttributeNames} from './rules/no-binding-like-attribute-names.js';

const rules = [noBindingLikeAttributeNames];

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
            this.#analyzer.program.getTypeChecker()
          )
        );
      }
      // TODO(justinfagnani): Add in analyzer diagnostics
      return [...(prevDiagnostics ?? []), ...diagnostics];
    }
  }

  // Set up the prototype chain to be:
  // instance -> InnerLanguageService.prototype -> instance.__proto__
  const innerLanguageService = Object.getPrototypeOf(instance);
  Object.setPrototypeOf(instance, LitLanguageService.prototype);
  Object.setPrototypeOf(LitLanguageService.prototype, innerLanguageService);

  new LitLanguageService(info, typescript);
};
