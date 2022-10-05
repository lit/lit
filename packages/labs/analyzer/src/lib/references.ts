/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {DiagnosticsError} from './errors.js';
import {AnalyzerInterface, Reference} from './model.js';
import {getModule} from './javascript/modules.js';
import {AbsolutePath} from './paths.js';

const npmModule = /^(?<package>(@\w+\/\w+)|\w+)\/?(?<module>.*)$/;

/**
 * Returns the module specifier for a declaration if it was imported,
 * or `undefined` if the declaration was not imported.
 */
const getImportModuleSpecifier = (declaration: ts.Node): string | undefined => {
  // TODO(kschaaf) support the various import syntaxes, e.g. `import {foo as bar} from 'baz'`
  if (
    ts.isImportSpecifier(declaration) &&
    ts.isNamedImports(declaration.parent) &&
    ts.isImportClause(declaration.parent.parent) &&
    ts.isImportDeclaration(declaration.parent.parent.parent)
  ) {
    const module = declaration.parent.parent.parent.moduleSpecifier
      .getText()
      // Remove quotes
      .slice(1, -1);
    return module;
  }
  return undefined;
};

/**
 * Returns an analyzer `Reference` model for the given ts.Symbol.
 *
 * If the symbol's declaration was imported, the Reference will be based on
 * the import's module specifier; otherwise the Reference will point to the
 * current module being analyzed.
 */
export function getReferenceForSymbol(
  symbol: ts.Symbol,
  location: ts.Node,
  analyzer: AnalyzerInterface
): Reference {
  const {path} = analyzer;
  const {name} = symbol;
  // TODO(kschaaf): Do we need to check other declarations? The assumption is
  // that even with multiple declarations (e.g. because of class interface +
  // constructor), the reference would point to the same location for all,
  // or else (in the case of e.g. namespace augmentation) it will be global
  // and not need a specific module specifier.
  const declaration = symbol?.declarations?.[0];
  if (declaration === undefined) {
    throw new DiagnosticsError(
      location,
      `Could not find declaration for symbol '${name}'`
    );
  }
  const declarationSourceFile = declaration.getSourceFile();
  const locationSourceFile = location.getSourceFile();
  // There are 6 cases to cover:
  // 1. A global symbol that wasn't imported; in this case, its declaration
  //    will exist in a different source file than where we got the symbol
  //    from. For all other cases, the symbol's declaration node will be in
  //    this file, either as an ImportModuleSpecifier or a normal declaration.
  // 2. A symbol imported from a URL. The declaration will be an
  //    ImportModuleSpecifier and its module path will be parsable as a URL.
  // 3. A symbol imported from a relative file within this package. The
  //    declaration will be an ImportModuleSpecifier and its module path will
  //    start with a '.'
  // 4. A symbol imported from an absolute path. The declaration will be an
  //    ImportModuleSpecifier and its module path will start with a '/' This
  //    is a weird case to cover in the analyzer because it isn't portable.
  // 5. A symbol imported from an external package. The declaration will be an
  //    ImportModuleSpecifier and its module path will not start with a '.'
  // 6. A symbol declared in this file. The declaration will be one of many
  //    declaration types (just not an ImportModuleSpecifier).
  if (declarationSourceFile !== locationSourceFile) {
    // If the reference declaration doesn't exist in this module, it must have
    // been a global (whose declaration is in an ambient .d.ts file)
    // TODO(kschaaf): We might want to further differentiate e.g. DOM globals
    // (that don't have any e.g. source to link to) from other ambient
    // declarations where we could at least point to a declaration file
    return new Reference({
      name,
      isGlobal: true,
    });
  } else {
    const moduleSpecifier = getImportModuleSpecifier(declaration);
    if (moduleSpecifier !== undefined) {
      let refPackage;
      let refModule;
      // The symbol was imported; check whether it is a URL, absolute, package
      // local, or external
      try {
        new URL(moduleSpecifier);
        refPackage = '';
        refModule = moduleSpecifier;
      } catch {
        if (moduleSpecifier[0] === '.') {
          // Relative import from this package: use the current package and
          // module path relative to this module
          const module = getModule(
            location.getSourceFile().fileName as AbsolutePath,
            analyzer
          );
          refPackage = module.packageJson.name;
          refModule = path.join(path.dirname(module.jsPath), moduleSpecifier);
        } else if (moduleSpecifier[0] === '/') {
          // Absolute import; no package, just use the entire path as the
          // module
          refPackage = '';
          refModule = moduleSpecifier;
        } else {
          // External import: extract the npm package (taking care to respect
          // npm orgs) and module specifier (if any)
          const info = moduleSpecifier.match(npmModule);
          if (!info || !info.groups) {
            throw new DiagnosticsError(
              declaration,
              `External npm package could not be parsed from module specifier '${moduleSpecifier}'.`
            );
          }
          refPackage = info.groups.package;
          refModule = info.groups.module || undefined;
        }
      }
      return new Reference({
        name,
        package: refPackage,
        module: refModule,
      });
    } else {
      // Declared in this file: use the current package and module
      const module = getModule(
        location.getSourceFile().fileName as AbsolutePath,
        analyzer
      );
      return new Reference({
        name,
        package: module.packageJson.name,
        module: module.jsPath,
      });
    }
  }
}
