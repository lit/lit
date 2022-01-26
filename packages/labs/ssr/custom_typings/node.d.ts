/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

declare module 'vm' {
  class Module {
    dependencySpecifiers: ReadonlyArray<string>;
    error?: unknown;
    namespace: {[name: string]: unknown};
    status:
      | 'unlinked'
      | 'linking'
      | 'linked'
      | 'evaluating'
      | 'evaluated'
      | 'errored';
    identifier: string;
    evaluate(): Promise<{result: unknown}>;
    link(
      linker: (
        specifier: string,
        referencingModule: Module
      ) => Module | Promise<Module>
    ): Promise<void>;
  }

  class SourceTextModule extends Module {
    context: any;
    constructor(
      source: string,
      options: {
        identifier: string;
        context: unknown;
        initializeImportMeta: (meta: {url: string}, module: Module) => void;
        importModuleDynamically: (
          specifier: string,
          module: Module,
          importAssertions: unknown
        ) => Promise<Module>;
      }
    );
    instantiate(): void;
  }

  class SyntheticModule extends Module {
    constructor(
      exportNames: string[],
      evaluateCallback: (this: SyntheticModule) => void,
      options: {identifier: string; context: unknown}
    );
    setExport(name: string, value: unknown): void;
  }
}
