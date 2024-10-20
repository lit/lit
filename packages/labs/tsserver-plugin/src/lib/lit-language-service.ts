import {Diagnostic, LanguageService} from 'typescript';
import {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import type ts from 'typescript/lib/tsserverlibrary';
import * as path from 'node:path';

/**
 * This class returns the inner language service from the constructor so that
 * it'll become the prototype of the instance, and let us use `this` and `super`
 * to call the original language service methods.
 */
const InnerLanguageService = class {
  constructor(inner: LanguageService) {
    return inner;
  }
} as new (prevLangService: LanguageService) => LanguageService;

/**
 * A language service that provides diagnostics for Lit modules.
 */
export class LitLanguageService extends InnerLanguageService {
  static isLitLanguageService(
    value: LanguageService
  ): value is LitLanguageService {
    return #brand in value;
  }

  #brand = true;
  #analyzer: Analyzer;
  #logger: ts.server.Logger;

  constructor(info: ts.server.PluginCreateInfo, typescript: typeof ts) {
    super(info.languageService);
    this.#logger = info.project.projectService.logger;
    this.#logger;
    this.#analyzer = new Analyzer({
      typescript,
      getProgram: () => this.getProgram()!,
      fs: typescript.sys,
      path,
    });
  }

  // LanguageService callbacks have to be own properties!
  override getSemanticDiagnostics = (
    ...args: Parameters<LanguageService['getSemanticDiagnostics']>
  ): Diagnostic[] => {
    console.log('@lit-labs/tsserver-plugin getSemanticDiagnostics');
    const [fileName] = args;
    const module = this.#analyzer.getModule(fileName as AbsolutePath);
    console.log(
      '@lit-labs/tsserver-plugin getSemanticDiagnostics module',
      module
    );
    const prevResult = super.getSemanticDiagnostics?.(...args);
    return prevResult ?? [];
  };
}
