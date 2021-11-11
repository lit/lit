/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import {promises as fs} from 'fs';
import {URL} from 'url';
import * as vm from 'vm';
import resolveAsync from 'resolve';
import {builtinModules} from 'module';

type PackageJSON = {main?: string; module?: string; 'jsnext:main'?: string};

const builtIns = new Set(builtinModules);

const specifierMatches = (specifier: string, match: string) =>
  specifier === match || specifier.startsWith(match + '/');

export interface ModuleRecord {
  path: string;
  module?: vm.Module;
  imports: Array<string>;
  evaluated: Promise<vm.Module>;
}

interface ImportResult {
  path: string;
  module: vm.Module;
}

export interface Options {
  global?: object;
  filesystem?: FileSystem;
}

/**
 * A JavaScript module loader that utilizes the Node `vm` module
 * (https://nodejs.org/api/vm.html).
 *
 * Most of the hooks implement fairly standard web-compatible module loading:
 *  - An import specifier resolver that uses Node module resoution
 *  - A linker that loads dependencies from the local filesystem
 *  - A module cache keyed by resolved URL
 *  - import.meta.url support
 *  - Dynamic import() that functions the same as static imports
 *
 * There are some behaviors specific to lit-html. Mainly that imports of certain
 * directives are redirected to Node/SSR compatible implementations.
 */
export class ModuleLoader {
  private static _nextVmContextId = 0;

  // This ID is appended to all module identifiers to work around an apparent
  // v8 bug where duplicate identifiers would cause a crash.
  private readonly _vmContextId = ModuleLoader._nextVmContextId++;

  private readonly _context: vm.Context;

  /**
   * TODO (justinfagnani): This is a temporary stand-in for a real graph API.
   * We want to be able to invalidate a module and the transitive closure
   * of its importers so that we can update the graph.
   *
   * The keys of the map are useful for enumering static imported modules
   * after an entrypoint is loaded.
   */
  readonly cache = new Map<string, ModuleRecord>();

  // TODO (justinfagnani): Allow passing a filesystem object to allow network
  // sources, in-memory for tests, etc.
  constructor(options?: Options) {
    this._context = vm.createContext(options?.global);
  }

  /**
   * Imports a module given by `path` into a new VM context with `contextGlobal` as the
   * global object.
   */
  async importModule(
    specifier: string,
    referrer: string
  ): Promise<ImportResult> {
    if (referrer.startsWith('file://')) {
      referrer = referrer.substring('file://'.length);
    }
    const result = await this._loadModule(specifier, referrer);
    const {module} = result;
    if (module.status === 'unlinked') {
      await result.module.link(this._linker);
    }
    if (module.status !== 'evaluated') {
      await result.module.evaluate();
    }
    return result;
  }

  /**
   * Performs the actual loading of module source from disk, creates the
   * Module instance, and maintains the module cache.
   *
   * Used directly by `importModule` and by the linker and dynamic import()
   * support function.
   */
  private async _loadModule(
    specifier: string,
    referrer: string
  ): Promise<ImportResult> {
    if (builtIns.has(specifier)) {
      return this._loadBuiltInModule(specifier);
    }

    const moduleURL = await resolveSpecifier(specifier, referrer);
    if (moduleURL.protocol !== 'file:') {
      throw new Error(`Unsupported protocol: ${moduleURL.protocol}`);
    }
    const modulePath = moduleURL.pathname;

    // Look in the cache
    let moduleRecord = this.cache.get(modulePath);
    if (moduleRecord !== undefined) {
      return {
        path: modulePath,
        module: await moduleRecord.evaluated,
      };
    }

    const modulePromise = (async () => {
      const source = await fs.readFile(modulePath, 'utf-8');
      // TODO: store and re-use cachedData:
      // https://nodejs.org/api/vm.html#sourcetextmodulecreatecacheddata
      return new vm.SourceTextModule(source, {
        initializeImportMeta,
        importModuleDynamically: this._importModuleDynamically,
        context: this._context,
        identifier: this._getIdentifier(modulePath),
      });
    })();

    moduleRecord = {
      path: modulePath,
      imports: [],
      evaluated: modulePromise,
    };
    this.cache.set(modulePath, moduleRecord);
    const module = await modulePromise!;
    return {
      path: modulePath,
      module,
    };
  }

  private async _loadBuiltInModule(specifier: string) {
    let moduleRecord = this.cache.get(specifier);
    if (moduleRecord !== undefined) {
      return {
        path: specifier,
        module: await moduleRecord.evaluated,
      };
    }
    // Provide basic support for built-in modules (needed for node shims of
    // DOM APIs like fetch)
    const modulePromise = (async () => {
      const mod = await import(specifier);
      return new vm.SyntheticModule(
        Object.keys(mod),
        function () {
          Object.keys(mod).forEach((key) => this.setExport(key, mod[key]));
        },
        {
          context: this._context,
          identifier: this._getBuiltInIdentifier(specifier),
        }
      );
    })();
    moduleRecord = {
      path: specifier,
      // TODO (justinfagnani): these imports should be populated in the linker
      // to record the edges of the module graph
      imports: [],
      evaluated: modulePromise!,
    };
    this.cache.set(specifier, moduleRecord);
    const module = await modulePromise!;
    return {
      path: specifier,
      module,
    };
  }

  private _importModuleDynamically = async (
    specifier: string,
    referencingModule: vm.Module
  ) => {
    const result = await this.importModule(
      specifier,
      referencingModule.identifier
    );
    return result.module;
  };

  private _linker = async (
    specifier: string,
    referencingModule: vm.Module
  ): Promise<vm.Module> => {
    const {identifier} = referencingModule;
    if (!/:\d+$/.test(identifier)) {
      throw new Error('Unexpected file:// URL identifier without context ID');
    }
    const referrer = identifier.split(/:\d+$/)[0];
    const result = await this._loadModule(specifier, referrer);
    const referrerModule = this.cache.get(referrer);
    if (referrerModule !== undefined) {
      referrerModule.imports.push(result.path);
    }
    return result.module;
  };

  private _getIdentifier(modulePath: string) {
    return `${modulePath}:${this._vmContextId}`;
  }

  private _getBuiltInIdentifier(specifier: string) {
    return `${specifier}:${this._vmContextId}`;
  }
}

/**
 * Resolves specifiers using web-ish Node module resolution. Web-compatible
 * full URLs are passed through unmodified. Relative and absolute URLs
 * (starting in `/`, `./`, `../`) are resolved relative to `referrer`. "Bare"
 * module specifiers are resolved with the 'resolve' package.
 *
 * This replaces some lit-html modules with SSR compatible equivalents. This is
 * currently hard-coded, but should instead be done with a configuration object.
 */
export const resolveSpecifier = async (
  specifier: string,
  referrer: string
): Promise<URL> => {
  try {
    // First see if the specifier is a full URL, and if so, use that.

    // TODO: This will mainly be http:// and https:// URLs, which we may _not_
    // want to support. We probably also want to filter out file:// URLs as
    // those will be absolute to the file system.
    return new URL(specifier);
  } catch (e) {
    if (referrer === undefined) {
      throw new Error('referrer is undefined');
    }
    if (
      specifierMatches(specifier, 'lit') ||
      specifierMatches(specifier, 'lit-html') ||
      specifierMatches(specifier, 'lit-element') ||
      specifierMatches(specifier, '@lit/reactive-element')
    ) {
      // Override where we resolve lit packages from so that we always resolve to
      // a single version.
      referrer = import.meta.url;
    }
    const modulePath = await resolve(specifier, {
      basedir: path.dirname(referrer),
      moduleDirectory: ['node_modules'],
      extensions: ['.js'],
      // Some packages use a non-standard alternative to the "main" field
      // in their package.json to differentiate their ES module version.
      packageFilter: (packageJson: PackageJSON) => {
        packageJson.main =
          packageJson.module ?? packageJson['jsnext:main'] ?? packageJson.main!;
        return packageJson;
      },
    });
    return new URL(`file:${modulePath}`);
  }
};

/**
 * Web-like import.meta initializer that sets up import.meta.url
 */
const initializeImportMeta = (meta: {url: string}, module: vm.Module) => {
  meta.url = module.identifier;
};

const resolve = async (
  id: string,
  opts: resolveAsync.AsyncOpts
): Promise<string> => {
  return new Promise((res, rej) => {
    resolveAsync(id, opts, (err, resolved) => {
      if (err != null) {
        rej(err);
      } else {
        res(resolved!);
      }
    });
  });
};
