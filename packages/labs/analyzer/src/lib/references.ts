/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type ts from 'typescript';
import {
  AnalyzerInterface,
  LocalNameOrReference,
  Reference,
  TypeScript,
} from './model.js';
import {
  getResolvedExportFromSourcePath,
  getPathForModuleSpecifier,
  getModuleInfo,
} from './javascript/modules.js';
import {AbsolutePath} from './paths.js';
import {createDiagnostic} from './errors.js';
import {DiagnosticCode} from './diagnostic-code.js';

const npmModule = /^(?<package>(@[^/]+\/[^/]+)|[^/]+)\/?(?<module>.*)$/;

/**
 * Returns a ts.Symbol for a name in scope at a given location in the AST.
 * TODO(kschaaf): There are ~1748 symbols in scope of a typical hello world,
 * due to DOM globals. Perf might become an issue here.
 */
export const getSymbolForName = (
  name: string,
  location: ts.Node,
  analyzer: AnalyzerInterface
): ts.Symbol | undefined => {
  return analyzer.program
    .getTypeChecker()
    .getSymbolsInScope(
      location,
      (analyzer.typescript.SymbolFlags as unknown as {All: number}).All
    )
    .filter((s) => s.name === name)[0];
};

interface ModuleSpecifierInfo {
  specifier: string;
  location: ts.Node;
  name: string;
}

/**
 * Returns the module specifier expression for a declaration if it was imported,
 * or `undefined` if the declaration was not imported.
 */
const getImportSpecifierInfo = (
  ts: TypeScript,
  declaration: ts.Node
): ModuleSpecifierInfo | undefined => {
  // TODO(kschaaf) support the various import syntaxes, e.g. `import {foo as bar} from 'baz'`
  if (
    ts.isImportSpecifier(declaration) &&
    ts.isNamedImports(declaration.parent) &&
    ts.isImportClause(declaration.parent.parent) &&
    ts.isImportDeclaration(declaration.parent.parent.parent)
  ) {
    const specifierExpression =
      declaration.parent.parent.parent.moduleSpecifier;
    const specifier = getSpecifierString(specifierExpression);
    return {
      specifier,
      location: specifierExpression,
      name: declaration.propertyName?.text ?? declaration.name.text,
    };
  }
  return undefined;
};

/**
 * Returns an analyzer `Reference` object for the given identifier.
 *
 * If the symbol's declaration was imported, the Reference will be based on
 * the import's module specifier; otherwise the Reference will point to the
 * current module being analyzed.
 */
export const getReferenceForIdentifier = (
  identifier: ts.Identifier,
  analyzer: AnalyzerInterface
) => {
  const symbol = analyzer.program
    .getTypeChecker()
    .getSymbolAtLocation(identifier);
  if (symbol === undefined) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: identifier,
        message: `Could not find symbol for identifier.`,
      })
    );
    return undefined;
  }
  return getReferenceForSymbol(symbol, identifier, analyzer);
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
): Reference | undefined {
  const {name: symbolName} = symbol;
  // TODO(kschaaf): Do we need to check other declarations? The assumption is
  // that even with multiple declarations (e.g. because of class interface +
  // constructor), the reference would point to the same location for all,
  // or else (in the case of e.g. namespace augmentation) it will be global
  // and not need a specific module specifier.
  const declaration = symbol?.declarations?.[0];
  if (declaration === undefined) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: location,
        message: `Could not find declaration for symbol '${symbolName}'`,
      })
    );
    return undefined;
  }
  const declarationSourceFile = declaration.getSourceFile();
  const locationSourceFile = location.getSourceFile();
  // There are three top-level cases to cover:
  // 1. A global symbol that wasn't imported.
  // 2. An imported symbol
  // 3. A symbol declared in this file.
  if (declarationSourceFile !== locationSourceFile) {
    // If the reference declaration doesn't exist in this module, it must have
    // been a global (whose declaration is in an ambient .d.ts file)
    // TODO(kschaaf): We might want to further differentiate e.g. DOM globals
    // (that don't have any e.g. source to link to) from other ambient
    // declarations where we could at least point to a declaration file
    return getGlobalReference(declarationSourceFile, symbolName, analyzer);
  } else {
    // For all other cases, the symbol's declaration node will be in this file,
    // either as an ImportDeclaration or a normal declaration.
    const importInfo = getImportSpecifierInfo(analyzer.typescript, declaration);
    if (importInfo !== undefined) {
      // Declaration was imported
      return getImportReference(
        importInfo.specifier,
        importInfo.location,
        importInfo.name,
        analyzer
      );
    } else {
      // Declared in this file: use the current package and module
      return getLocalReference(location, symbolName, analyzer);
    }
  }
}

/**
 * Returns a `Reference` for a global symbol that was not imported.
 */
const getGlobalReference = (
  declarationSourceFile: ts.SourceFile,
  name: string,
  analyzer: AnalyzerInterface
) => {
  return new Reference({
    name,
    isGlobal: true,
    dereference: () =>
      getResolvedExportFromSourcePath(
        declarationSourceFile.fileName as AbsolutePath,
        name,
        analyzer
      ),
  });
};

/**
 * Returns a `Reference` for a symbol that was imported.
 *
 * There are 4 main categories of imports we cover:
 *
 * 1. A symbol imported from a URL. The declaration will be an
 *    ImportModuleSpecifier and its module path will be parsable as a URL.
 *
 * 2. A symbol imported from a relative file within this package. The
 *    declaration will be an ImportModuleSpecifier and its module path will
 *    start with a '.'
 *
 * 3. A symbol imported from an absolute path. The declaration will be an
 *    ImportModuleSpecifier and its module path will start with a '/' This is a
 *    weird case to cover in the analyzer because it isn't portable.
 *
 * 4. A symbol imported from an external package. The declaration will be an
 *    ImportModuleSpecifier and its module path will not start with a '.'
 */
export const getImportReference = (
  specifier: string,
  location: ts.Node,
  name: string,
  analyzer: AnalyzerInterface
) => {
  const {path} = analyzer;
  let refPackage;
  let refModule;
  // Check whether it is a URL, absolute, package local, or external
  try {
    new URL(specifier);
    refPackage = '';
    refModule = specifier;
  } catch {
    if (specifier[0] === '.') {
      // Relative import from this package: use the current package and
      // module path relative to this module
      const sourceFilePath = location.getSourceFile().fileName as AbsolutePath;
      const module = getModuleInfo(sourceFilePath, analyzer);
      refPackage = module.packageJson.name;
      refModule = path.join(path.dirname(module.jsPath), specifier);
    } else if (analyzer.path.isAbsolute(specifier)) {
      // Absolute import; no package, just use the entire path as the
      // module
      refPackage = '';
      refModule = specifier;
    } else {
      // External import: extract the npm package (taking care to respect
      // npm orgs) and module specifier (if any)
      const info = specifier.match(npmModule);
      if (info?.groups) {
        refPackage = info.groups.package;
        refModule = info.groups.module || undefined;
      } else {
        analyzer.addDiagnostic(
          createDiagnostic({
            typescript: analyzer.typescript,
            node: location,
            message: `External npm package could not be parsed from module specifier '${specifier}'.`,
          })
        );
      }
    }
  }
  return new Reference({
    name,
    package: refPackage,
    module: refModule,
    dereference: () => {
      const path = getPathForModuleSpecifier(specifier, location, analyzer);
      if (path === undefined) {
        return;
      }
      return getResolvedExportFromSourcePath(path, name, analyzer);
    },
  });
};

/**
 * Returns a `Reference` for a symbol that was imported.
 */
export const getImportReferenceForSpecifierExpression = (
  specifierExpression: ts.Expression,
  name: string,
  analyzer: AnalyzerInterface
) => {
  const specifier = getSpecifierString(specifierExpression);
  return getImportReference(specifier, specifierExpression, name, analyzer);
};

/**
 * Returns a `Reference` to a symbol declared in the current source file.
 */
const getLocalReference = (
  location: ts.Node,
  name: string,
  analyzer: AnalyzerInterface
) => {
  const module = getModuleInfo(
    location.getSourceFile().fileName as AbsolutePath,
    analyzer
  );
  return new Reference({
    name,
    package: module.packageJson.name,
    module: module.jsPath,
    dereference: () =>
      getResolvedExportFromSourcePath(
        location.getSourceFile().fileName as AbsolutePath,
        name,
        analyzer
      ),
  });
};

/**
 * For a given export clause and (optional) specifier from an export statement,
 * returns an array of objects mapping the export name to a
 * LocalNameOrReference, which is a string name that can be looked up directly
 * in `getDeclaration()` of the declaring module for local declarations, or a
 * `Reference` in the case of re-exported declarations.
 *
 * For example:
 * ```
 *   import {a} from 'foo';
 *   const b = 'b';
 *   const c = 'c';
 *   export {a as x, b as y, c};
 * ```
 * This would return (using pseudo-code for Reference objects):
 * ```
 * [
 *   {name: 'x', reference: new Reference('a', 'foo')},
 *   {name: 'y', reference: 'b'},
 *   {name: 'c', reference: 'c'},
 * ]
 * ```
 *
 * This also handles explicit re-export syntax, which all become References:
 * ```
 *   export {a as x, b as y, c} from 'foo';
 * ```
 *
 * Finally, this handles namespace exports, which become a single Reference:
 * ```
 *   export * as ns from 'foo';
 * ```
 * becomes:
 * ```
 *   [{name: 'ns', reference: new Reference('*', 'foo')}]
 * ```
 */
export const getExportReferences = (
  exportClause: ts.NamedExportBindings,
  moduleSpecifier: ts.Expression | undefined,
  analyzer: AnalyzerInterface
): Array<{exportName: string; decNameOrRef: LocalNameOrReference}> => {
  const {typescript} = analyzer;
  const refs: Array<{exportName: string; decNameOrRef: string | Reference}> =
    [];
  if (typescript.isNamedExports(exportClause)) {
    for (const el of exportClause.elements) {
      const exportName = el.name.getText();
      const localNameNode = el.propertyName ?? el.name;
      const localName = localNameNode.getText();
      if (moduleSpecifier !== undefined) {
        // This was an explicit re-export (e.g. `export {a} from 'foo'`), so add
        // a Reference
        const specifier = getSpecifierString(moduleSpecifier);
        refs.push({
          exportName,
          decNameOrRef: getImportReference(
            specifier,
            moduleSpecifier,
            localName,
            analyzer
          ),
        });
      } else {
        // Get the declaration for this symbol, so we can determine if
        // it was declared locally or not. Note we use name-based searching
        // to find the symbol, because `getSymbolAtLocation()` for
        // `export {Foo}` will annoyingly just point back to the export
        // line, rather than the location it was actually declared.
        const symbol = getSymbolForName(localName, localNameNode, analyzer);
        const decl = symbol?.declarations?.[0];
        if (symbol === undefined || decl === undefined) {
          analyzer.addDiagnostic(
            createDiagnostic({
              typescript,
              node: el,
              message: `Could not find declaration for symbol`,
            })
          );
          continue;
        }
        if (typescript.isImportSpecifier(decl)) {
          // If the declaration was an import specifier, this means it's being
          // re-exported, so add a Reference
          const ref = getReferenceForSymbol(symbol, decl, analyzer);
          if (ref !== undefined) {
            refs.push({
              exportName,
              decNameOrRef: ref,
            });
          }
        } else {
          // Otherwise, the declaration is local, so just add its name; this
          // can be looked up directly in `getDeclaration` for the module
          refs.push({exportName, decNameOrRef: localName});
        }
      }
    }
  } else if (
    // e.g. `export * as ns from 'foo'`;
    typescript.isNamespaceExport(exportClause) &&
    moduleSpecifier !== undefined
  ) {
    const specifier = getSpecifierString(moduleSpecifier);
    refs.push({
      exportName: exportClause.name.getText(),
      decNameOrRef: getImportReference(
        specifier,
        moduleSpecifier,
        '*',
        analyzer
      ),
    });
  } else {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript,
        node: exportClause,
        message: `Unhandled form of ExportDeclaration`,
        category: typescript.DiagnosticCategory.Warning,
        code: DiagnosticCode.UNSUPPORTED,
      })
    );
  }
  return refs;
};

/**
 * Returns the specifier string from a specifier expression.
 *
 * For a given import statement:
 * ```
 * import {foo} from 'foo/bar.js';
 * ```
 * The specifierExpression is the string literal 'foo/bar.js' whose getText()
 * includes the quotes. This function returns the string value without the
 * quotes.
 */
export const getSpecifierString = (specifierExpression: ts.Expression) => {
  // A specifier expression is always expected to be a quoted string literal.
  // Slice off the quotes and return the text.
  return specifierExpression.getText().slice(1, -1);
};
