/**
 * @file This module implements the JS module loader hooks required by the Node
 * `vm` module (https://nodejs.org/api/vm.html).
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

import * as path from 'path';
import {promises as fs} from 'fs';
import {URL} from 'url';
import * as vm from 'vm';
import resolve from 'resolve';
import {builtinModules} from 'module';

type PackageJSON = {main?: string; module?: string; 'jsnext:main'?: string};

const isRelativeOrAbsolutePath = (s: string) =>
  s.match(/^(\.){0,2}\//) !== null;

const builtIns = new Set(builtinModules);

/**
 * Resolves specifiers using web-ish Node module resolution. Web-compatible
 * full URLs are passed through unmodified. Relative and absolute URLs
 * (starting in `/`, `./`, `../`) are resolved relative to `referrer`. "Bare"
 * module specifiers are resolved with the 'resolve' package.
 *
 * This replaces some lit-html modules with SSR compatible equivalents. This is
 * currently hard-coded, but should instead be done with a configuration object.
 */
const resolveSpecifier = (specifier: string, referrer: string): URL => {
  if (referrer === undefined) {
    throw new Error('referrer is undefined');
  }

  try {
    // First see if the specifier is a full URL, and if so, use that.

    // TODO: This will mainly be http:// and https:// URLs, which we may _not_
    // want to support. We probably also want to filter out file:// URLs as
    // those will be absolute to the file system.
    return new URL(specifier);
  } catch (e) {
    if (isRelativeOrAbsolutePath(specifier)) {
      return new URL(specifier, referrer);
    }

    if (
      specifier.startsWith('lit-html') ||
      specifier.startsWith('lit-element')
    ) {
      // Override where we resolve lit-html from so that we always resolve to
      // a single version of lit-html.
      referrer = import.meta.url;
    }
    const referencingModulePath = new URL(referrer).pathname;
    const modulePath = resolve.sync(specifier, {
      basedir: path.dirname(referencingModulePath),
      moduleDirectory: ['node_modules'],
      extensions: ['.js'],
      // Some packages use a non-standard alternative to the "main" field
      // in their package.json to differentiate their ES module version.
      packageFilter: (packageJson: PackageJSON) => {
        packageJson.main =
          packageJson.module || packageJson['jsnext:main'] || packageJson.main;
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

let vmContextId = 0;

/**
 * Imports a module given by `path` into a new VM context with `sandbox` as the
 * global object.
 *
 * @param specifier
 * @param referrer
 * @param sandbox The object that will become the global, via vm.createContext
 */
export const importModule = async (
  specifier: string,
  referrer: string,
  sandbox: vm.Context
) => {
  // TODO: maybe move this call outside this function and share across requests.
  // Only if we can freeze all globals though.
  const context = vm.createContext(sandbox);
  vmContextId++;

  // TODO: consider a multi-level cache with one cache shared across requests.
  // We could mark some modules as safe for reuse, like lit-html & lit-element.
  // Only possible if we can freeze and reuse the global as needed for the
  // above TODO as well. Even then, any object shared across requests could be a
  // potential source of cross-request leaks.
  const moduleCache = new Map<string, Promise<vm.Module>>();

  /**
   * Performs the actual loading of module source from disk, creates the
   * Module instance, and maintains the module cache.
   *
   * Used directly by `importModule` and by the linker and dynamic import()
   * support function.
   */
  const loadModule = async (
    specifier: string,
    referrer: string
  ): Promise<vm.Module> => {
    const moduleURL = resolveSpecifier(specifier, referrer);
    if (moduleURL.protocol !== 'file:') {
      throw new Error(`Unsupported protocol: ${moduleURL.protocol}`);
    }
    const modulePath = moduleURL.pathname;
    let modulePromise = moduleCache.get(modulePath);
    if (modulePromise !== undefined) {
      return modulePromise;
    }
    modulePromise = (async () => {
      // Provide basic support for built-in modules (needed for node shims of
      // DOM API's like fetch)
      if (builtIns.has(specifier)) {
        const mod = await import(specifier);
        return new vm.SyntheticModule(
          Object.keys(mod),
          function () {
            Object.keys(mod).forEach((key) => this.setExport(key, mod[key]));
          },
          {
            context,
            identifier: specifier + `:${vmContextId}`,
          }
        );
      } else {
        const source = await fs.readFile(modulePath, 'utf-8');
        // TODO: store and re-use cachedData:
        // https://nodejs.org/api/vm.html#vm_constructor_new_vm_sourcetextmodule_code_options
        return new vm.SourceTextModule(source, {
          initializeImportMeta,
          importModuleDynamically,
          context,
          identifier: moduleURL.toString() + `:${vmContextId}`,
        });
      }
    })();
    moduleCache.set(modulePath, modulePromise);
    return modulePromise;
  };

  /**
   * A Node vm linker: https://nodejs.org/api/vm.html#vm_module_link_linker
   */
  const linker = async (
    specifier: string,
    referencingModule: vm.Module
  ): Promise<vm.Module> => {
    return loadModule(specifier, referencingModule.identifier);
  };

  const importModuleDynamically = async (
    specifier: string,
    referencingModule: vm.Module
  ) => {
    return _importModule(specifier, referencingModule.identifier);
  };

  const _importModule = async (specifier: string, referrer: string) => {
    const module = await loadModule(specifier, referrer);
    await module.link(linker);
    await module.evaluate();
    return module;
  };

  return _importModule(specifier, referrer);
};
