export {};

declare global {
  interface ImportMeta {
    url: string;
  }
}

declare module 'vm' {
  class Module {
    dependencySpecifiers: ReadonlyArray<string>;
    error?: any;
    namespace: any;
    status: string;
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
    constructor(source: string, options: any);
    instantiate(): void;
  }

  class SyntheticModule extends Module {
    constructor(
      exportNames: string[],
      evaluateCallback: (this: SyntheticModule) => void,
      options: any
    );
    setExport(name: string, value: any);
  }
}
