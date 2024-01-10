/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import {promises as fs} from 'fs';
import {fileURLToPath, pathToFileURL} from 'url';
import * as vm from 'vm';
import enhancedResolve from 'enhanced-resolve';
import {builtinModules} from 'module';

const builtIns = new Set(builtinModules);

const specifierMatches = (specifier: string, match: string) =>
  specifier === match || specifier.startsWith(match + '/');

/**
 * We store Module identifiers as `${modulePath}:${this._vmContextId}`.
 * This regex matches the vm context id.
 */
const CONTEXT_ID = /:\d+$/;

/**
 * Creates a new object that provides a basic set of globals suitable for use as
 * the default context object for a VM module.
 *
 * Note this does not return all default Node globals, rather it returns the
 * subset of Node globals which are also defined in browsers.
 */
export function makeDefaultContextObject() {
  // Everything at or below Node 14 can be always assumed present, since that's
  // the lowest version we support.
  //
  // Note we create new objects for things like console and performance so that
  // VM contexts can't override the parent context implementations.
  const ctx: Partial<typeof globalThis> = {
    // Node 0.10.0+
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    console: {
      assert: (...args) => console.assert(...args),
      clear: (...args) => console.clear(...args),
      count: (...args) => console.count(...args),
      countReset: (...args) => console.countReset(...args),
      debug: (...args) => console.debug(...args),
      dir: (...args) => console.dir(...args),
      dirxml: (...args) => console.dirxml(...args),
      error: (...args) => console.error(...args),
      group: (...args) => console.group(...args),
      groupCollapsed: (...args) => console.groupCollapsed(...args),
      groupEnd: (...args) => console.groupEnd(...args),
      info: (...args) => console.info(...args),
      log: (...args) => console.log(...args),
      profile: (...args) => console.profile(...args),
      profileEnd: (...args) => console.profileEnd(...args),
      table: (...args) => console.table(...args),
      time: (...args) => console.time(...args),
      timeEnd: (...args) => console.timeEnd(...args),
      timeLog: (...args) => console.timeLog(...args),
      timeStamp: (...args) => console.timeStamp(...args),
      trace: (...args) => console.trace(...args),
      warn: (...args) => console.warn(...args),
    } as typeof console,
    // Node 8.5.0+
    performance: {
      clearMarks: (...args) => performance.clearMarks(...args),
      clearMeasures: (...args) => performance.clearMeasures(...args),
      clearResourceTimings: (...args) =>
        performance.clearResourceTimings(...args),
      getEntries: (...args) => performance.getEntries(...args),
      getEntriesByName: (...args) => performance.getEntriesByName(...args),
      getEntriesByType: (...args) => performance.getEntriesByType(...args),
      mark: (...args) => performance.mark(...args),
      measure: (...args) => performance.measure(...args),
      now: (...args) => performance.now(...args),
      setResourceTimingBufferSize: (...args) =>
        performance.setResourceTimingBufferSize(...args),
      get timeOrigin() {
        return performance.timeOrigin;
      },
    } as typeof performance,
    // Node 10+
    URL,
    URLSearchParams,
    // Node 11+
    queueMicrotask,
  };
  // Everything above Node 14 should be set conditionally.
  // Node 16+
  if (globalThis.atob !== undefined) {
    ctx.atob = atob;
  }
  if (globalThis.btoa !== undefined) {
    ctx.btoa = btoa;
  }
  // Node 17+
  if (globalThis.structuredClone !== undefined) {
    ctx.structuredClone = structuredClone;
  }
  // Node 18+
  if (globalThis.fetch !== undefined) {
    ctx.fetch = fetch;
  }
  return ctx;
}

// IMPORTANT: We should always use our own VmModule interface for public APIs
// instead of vm.Module, because vm.Module typings are not provided by
// @types/node, and we do not augment them in a way that affects consumers (the
// types in custom_typings are only available during our own build).

/**
 * A subset of the Node vm.Module API.
 */
export interface VmModule {
  /**
   * The namespace object of the module that provides access to its exports.
   * See https://nodejs.org/api/vm.html#modulenamespace
   */
  namespace: {[name: string]: unknown};
}

export interface ModuleRecord {
  path: string;
  module?: VmModule;
  imports: Array<string>;
  evaluated: Promise<VmModule>;
}

interface ImportResult {
  path: string;
  module: VmModule;
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
 *  - An import specifier resolver that uses Node module resolution
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
   * The keys of the map are useful for enumerating static imported modules
   * after an entrypoint is loaded.
   */
  readonly cache = new Map<string, ModuleRecord>();

  // TODO (justinfagnani): Allow passing a filesystem object to allow network
  // sources, in-memory for tests, etc.
  constructor(options?: Options) {
    this._context = vm.createContext(
      options?.global ?? makeDefaultContextObject()
    );
  }

  /**
   * Imports a module given by `path` into a new VM context with `contextGlobal` as the
   * global object.
   */
  async importModule(
    specifier: string,
    referrerPathOrFileUrl: string
  ): Promise<ImportResult> {
    const referrerPath = referrerPathOrFileUrl.startsWith('file://')
      ? fileURLToPath(referrerPathOrFileUrl)
      : referrerPathOrFileUrl;
    const result = await this._loadModule(specifier, referrerPath);
    const module = result.module as vm.Module;
    if (module.status === 'unlinked') {
      await module.link(this._linker);
    }
    if (module.status !== 'evaluated') {
      await module.evaluate();
    }
    return result;
  }

  /**
   * Performs the actual loading of module source from disk, creates the Module
   * instance, and maintains the module cache. Also loads all dependencies of
   * the module.
   *
   * Used directly by `importModule` and by the linker and dynamic import()
   * support function.
   */
  private async _loadModule(
    specifier: string,
    referrerPath: string
  ): Promise<ImportResult> {
    if (builtIns.has(specifier)) {
      return this._loadBuiltInModule(specifier);
    }

    const moduleURL = await resolveSpecifier(specifier, referrerPath);
    if (moduleURL.protocol !== 'file:') {
      throw new Error(`Unsupported protocol: ${moduleURL.protocol}`);
    }
    const modulePath = fileURLToPath(moduleURL);

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
    const module = await modulePromise;
    // Modules must be fully loaded before linking. Therefore `_loadModule` must
    // also load its dependencies.
    // Reference: https://tc39.es/ecma262/#table-abstract-methods-of-module-records
    const moduleReferrerPath = this.getModulePath(module);
    await Promise.all(
      module.dependencySpecifiers.map((s) =>
        this._loadModule(s, moduleReferrerPath)
      )
    );
    return {
      path: modulePath,
      module,
    };
  }

  private async _loadBuiltInModule(specifier: string): Promise<ImportResult> {
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
      evaluated: modulePromise,
    };
    this.cache.set(specifier, moduleRecord);
    const module = await modulePromise;
    return {
      path: specifier,
      module,
    };
  }

  private _importModuleDynamically = async (
    specifier: string,
    referencingModule: vm.Module
  ): Promise<vm.Module> => {
    const result = await this.importModule(
      specifier,
      referencingModule.identifier
    );
    return result.module as vm.Module;
  };

  private _linker = async (
    specifier: string,
    referencingModule: vm.Module
  ): Promise<vm.Module> => {
    const referrerPath = this.getModulePath(referencingModule);
    const result = await this._loadModule(specifier, referrerPath);
    const referrerModule = this.cache.get(referrerPath);
    if (referrerModule !== undefined) {
      referrerModule.imports.push(result.path);
    }
    return result.module as vm.Module;
  };

  private _getIdentifier(modulePath: string) {
    return `${modulePath}:${this._vmContextId}`;
  }

  private _getBuiltInIdentifier(specifier: string) {
    return `${specifier}:${this._vmContextId}`;
  }

  /**
   * `getModulePath` returns the file path for a provided module.
   */
  private getModulePath(module: vm.Module): string {
    const {identifier} = module;
    if (!CONTEXT_ID.test(identifier)) {
      throw new Error(
        'Internal error: Unexpected file:// URL identifier without context ID. ' +
          'Expected identifier in form: "/packages/lit-element.js:8".'
      );
    }
    return identifier.split(CONTEXT_ID)[0];
  }
}

/**
 * Resolves specifiers using web-ish Node module resolution. Web-compatible full
 * URLs are passed through unmodified. Relative and absolute URLs (starting in
 * `/`, `./`, `../`) are resolved relative to `referrerPath`. "Bare" module
 * specifiers are resolved with the 'resolve' package.
 *
 * This replaces some Lit modules with SSR compatible equivalents. This is
 * currently hard-coded, but should instead be done with a configuration object.
 */
export const resolveSpecifier = async (
  specifier: string,
  referrerPath: string
): Promise<URL> => {
  try {
    // First see if the specifier is a full URL, and if so, use that.

    // TODO: This will mainly be http:// and https:// URLs, which we may _not_
    // want to support. We probably also want to filter out file:// URLs as
    // those will be absolute to the file system.
    return new URL(specifier);
  } catch (e) {
    if (referrerPath === undefined) {
      throw new Error('referrerPath is undefined');
    }
    if (
      specifierMatches(specifier, 'lit') ||
      specifierMatches(specifier, 'lit-html') ||
      specifierMatches(specifier, 'lit-element') ||
      specifierMatches(specifier, '@lit/reactive-element')
    ) {
      // Override where we resolve lit packages from so that we always resolve to
      // a single version.
      referrerPath = fileURLToPath(import.meta.url);
    }
    const modulePath = await resolve(specifier, path.dirname(referrerPath), {
      modules: ['node_modules'],
      extensions: ['.js'],
      mainFields: ['module', 'jsnext:main', 'main'],
      conditionNames: ['node', 'module', 'import'],
    });
    return pathToFileURL(modulePath) as URL;
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
  path: string,
  opts: Partial<enhancedResolve.ResolveOptions>
): Promise<string> => {
  const resolver = enhancedResolve.create(opts);
  return new Promise((res, rej) => {
    resolver(
      {},
      path,
      id,
      {},
      (err: unknown, resolved?: string | false | undefined) => {
        if (err != null) {
          rej(err);
        } else if (resolved === false || resolve === undefined) {
          rej(`could not resolve ${id}`);
        } else {
          res(resolved!);
        }
      }
    );
  });
};
