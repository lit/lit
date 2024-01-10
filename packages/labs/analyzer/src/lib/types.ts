/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type ts from 'typescript';
import {getPackageInfo} from './javascript/packages.js';
import {Type, Reference, AnalyzerInterface} from './model.js';
import {
  AbsolutePath,
  absoluteToPackage,
  PackagePath,
  resolveExtension,
} from './paths.js';
import {
  getImportReference,
  getReferenceForSymbol,
  getSymbolForName,
} from './references.js';
import {createDiagnostic} from './errors.js';

export type TypeScript = typeof ts;

/**
 * Returns an analyzer `Type` object for the given type string,
 * evaluated at the given location.
 *
 * Used for parsing types from JSDoc.
 */
export const getTypeForTypeString = (
  typeString: string,
  location: ts.Node,
  analyzer: AnalyzerInterface
): Type | undefined => {
  const {typescript, program} = analyzer;
  if (typeString !== undefined) {
    const typeNode = parseType(typescript, typeString);
    if (typeNode == undefined) {
      analyzer.addDiagnostic(
        createDiagnostic({
          typescript,
          node: location,
          message: `Failed to parse type from JSDoc comment.`,
          category: typescript.DiagnosticCategory.Warning,
        })
      );
      return undefined;
    }
    const type = program.getTypeChecker().getTypeFromTypeNode(typeNode);
    return new Type({
      type,
      text: typeString,
      getReferences: () =>
        getReferencesForTypeNode(typeNode, location, analyzer),
    });
  } else {
    return undefined;
  }
};

/**
 * Returns an analyzer `Type` object for the given AST node.
 */
export const getTypeForNode = (
  node: ts.Node,
  analyzer: AnalyzerInterface
): Type => {
  return getTypeForType(
    analyzer.program.getTypeChecker().getTypeAtLocation(node),
    node,
    analyzer
  );
};

/**
 * Converts a ts.Type into an analyzer Type object (which wraps
 * the ts.Type, but also provides analyzer Reference objects).
 */
export const getTypeForType = (
  type: ts.Type,
  location: ts.Node,
  analyzer: AnalyzerInterface
): Type => {
  const {typescript} = analyzer;
  const checker = analyzer.program.getTypeChecker();
  // Ensure we treat inferred `foo = 'hi'` as 'string' not '"hi"'
  type = checker.getBaseTypeOfLiteralType(type);
  const text = checker.typeToString(type);
  const typeNode = checker.typeToTypeNode(
    type,
    location,
    typescript.NodeBuilderFlags.IgnoreErrors
  );
  let getReferences;
  if (typeNode === undefined) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript,
        node: location,
        message: `Could not convert type to type node`,
        category: typescript.DiagnosticCategory.Warning,
      })
    );
    getReferences = () => [];
  } else {
    getReferences = () =>
      getReferencesForTypeNode(typeNode, location, analyzer);
  }
  return new Type({
    type,
    text,
    getReferences,
  });
};

/**
 * For a given TypeNode syntax tree, walk the AST and extract Reference
 * model objects for any TypeReferenceNode or ImportTypeNode's.
 */
const getReferencesForTypeNode = (
  typeNode: ts.TypeNode,
  location: ts.Node,
  analyzer: AnalyzerInterface
): Reference[] => {
  const {typescript} = analyzer;
  const references: Reference[] = [];
  const visit = (node: ts.Node) => {
    if (typescript.isTypeReferenceNode(node)) {
      const name = getRootName(typescript, node.typeName);
      // TODO(kschaaf): we'd like to just do
      // `checker.getSymbolAtLocation(node)` to get the symbol, but it appears
      // that nodes created with `checker.typeToTypeNode()` do not have
      // associated symbols, so we need to look up by name via
      // `checker.getSymbolsInScope()`
      const symbol = getSymbolForName(name, location, analyzer);
      if (symbol === undefined) {
        analyzer.addDiagnostic(
          createDiagnostic({
            typescript,
            node: location,
            message: `Could not get symbol for '${name}'.`,
          })
        );
        return;
      }
      const ref = getReferenceForSymbol(symbol, location, analyzer);
      if (ref !== undefined) {
        references.push(ref);
      }
    } else if (typescript.isImportTypeNode(node)) {
      if (!typescript.isLiteralTypeNode(node.argument)) {
        analyzer.addDiagnostic(
          createDiagnostic({
            typescript,
            node: node.argument,
            message: 'Expected a string literal.',
          })
        );
        return;
      }
      const name = getRootName(typescript, node.qualifier);
      if (!typescript.isStringLiteral(node.argument.literal)) {
        analyzer.addDiagnostic(
          createDiagnostic({
            typescript,
            node: node.argument.literal,
            message: `Expected import specifier to be a string literal`,
          })
        );
        return;
      }
      const specifier = getSpecifierFromTypeImport(
        node.argument.literal.text,
        analyzer
      );
      // TODO(kschaaf): This may have been an inferred type from a transitive
      // dependency; in this case we should include version information in the
      // reference model
      references.push(
        getImportReference(specifier, node.argument.literal, name, analyzer)
      );
    }
    typescript.forEachChild(node, visit);
  };
  visit(typeNode);
  return references;
};

/**
 * If the given specifier is an absolute path, turns it into an npm import
 * specifier by looking for its package.json and using package information found
 * there.
 *
 * If the path was not absolute, it returns the specifier as-is.
 */
const getSpecifierFromTypeImport = (
  specifier: string,
  analyzer: AnalyzerInterface
) => {
  specifier = analyzer.path.normalize(
    resolveExtension(specifier as AbsolutePath, analyzer)
  );
  if (analyzer.path.isAbsolute(specifier)) {
    const {
      rootDir,
      name,
      packageJson: {main, module},
    } = getPackageInfo(specifier as AbsolutePath, analyzer);
    let modulePath = absoluteToPackage(
      specifier as AbsolutePath,
      rootDir,
      analyzer.path.sep
    );
    const packageMain = module ?? main;
    if (packageMain !== undefined && modulePath === packageMain) {
      modulePath = '' as PackagePath;
    }
    specifier = name + (modulePath ? `/${modulePath}` : '');
  }
  return specifier;
};

/**
 * Gets the left-most name of a (possibly qualified) identifier, i.e.
 * 'Foo' returns 'Foo', but 'ts.SyntaxKind' returns 'ts'. This is the
 * symbol that would need to be imported into a given scope.
 */
const getRootName = (
  typescript: TypeScript,
  name: ts.Identifier | ts.QualifiedName | undefined
): string => {
  if (name === undefined) {
    return '';
  }
  if (typescript.isQualifiedName(name)) {
    return getRootName(typescript, name.left);
  } else {
    return name.text;
  }
};

/**
 * Below is a minimal LanguageService that allows quickly parsing snippets of TS
 * syntax into an AST. There's one file `contents.ts` in the program that we
 * update with snippets to parse.
 *
 * This allows extracting a type string from a custom JSDoc comment (like
 * `@event`), parsing it into syntax, and than walking it to extract references.
 *
 * Note, the program may have semantic errors (e.g. it may reference imports
 * that aren't included in the snippet), but that's ok because we only care
 * about parsing the syntax. When extracting references, we can use
 * `getSymbolByName` to re-associate symbols by name from a disassociated syntax
 * tree and the actual program.
 *
 * TODO(kschaaf): Providing diagnostic errors for semantically incorrect custom
 * JSDoc types would be nice, but that's pretty difficult in analyzers
 * where we don't control the TS program creation such that we can re-write
 * source files, etc. (as is the case when using in plugins).
 */

let contents = '';
let contentsId = 0;

const services = new WeakMap<TypeScript, ts.LanguageService>();
const getService = (typescript: TypeScript) => {
  let service = services.get(typescript);
  if (service === undefined) {
    service = typescript.createLanguageService(
      {
        getScriptFileNames: () => ['contents.ts'],
        getScriptVersion: () => contentsId.toString(),
        getScriptSnapshot: () => typescript.ScriptSnapshot.fromString(contents),
        getCurrentDirectory: () => '',
        getCompilationSettings: () => ({include: ['contents.ts']}),
        getDefaultLibFileName: (options) =>
          typescript.getDefaultLibFilePath(options),
        fileExists: () => true,
        readFile: () => undefined,
        readDirectory: () => [],
        directoryExists: () => true,
        getDirectories: () => [],
      },
      typescript.createDocumentRegistry()
    );
    services.set(typescript, service);
  }
  return service;
};

/**
 * Uses the stub LSH above to parse a type string and return a syntax-only
 * TypeNode (there will be no valid symbol information retrievable directly from
 * these nodes).
 */
// TODO (justinfagnani): This would probably be a bit cleaner as an instance
// method on Analyzer now.
const parseType = (
  typescript: TypeScript,
  typeString: string
): ts.TypeNode | undefined => {
  // Update the file
  contents = `export type typeToParse = ${typeString}`;
  contentsId++;
  // Get a new program & parsed source file
  const sourceFile = getService(typescript)
    .getProgram()
    ?.getSourceFileByPath('contents.ts' as ts.Path);
  if (sourceFile === undefined) {
    return undefined;
  }
  // Find the type alias node and return it
  let typeNode: ts.TypeNode | undefined = undefined;
  typescript.forEachChild(sourceFile, (node) => {
    if (typescript.isTypeAliasDeclaration(node)) {
      typeNode = node.type;
    }
  });
  return typeNode;
};
