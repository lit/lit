/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {DiagnosticsError} from './errors.js';
import {getPackageInfo} from './javascript/packages.js';
import {Type, Reference, AnalyzerInterface} from './model.js';
import {
  AbsolutePath,
  absoluteToPackage,
  PackagePath,
  resolveExtension,
} from './paths.js';
import {getImportReference, getReferenceForSymbol} from './references.js';

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
      (ts.SymbolFlags as unknown as {All: number}).All
    )
    .filter((s) => s.name === name)[0];
};

/**
 * Returns an analyzer `Type` object for the given jsDoc tag.
 *
 * Note, the tag type must
 */
export const getTypeForJSDocTag = (
  tag: ts.JSDocTag,
  analyzer: AnalyzerInterface
): Type | undefined => {
  const typeString =
    ts.isJSDocUnknownTag(tag) && typeof tag.comment === 'string'
      ? tag.comment?.match(/{(?<type>.*)}/)?.groups?.type
      : undefined;
  if (typeString !== undefined) {
    const typeNode = parseType(typeString);
    if (typeNode == undefined) {
      throw new DiagnosticsError(
        tag,
        `Internal error: failed to parse type from JSDoc comment.`
      );
    }
    const type = analyzer.program
      .getTypeChecker()
      .getTypeFromTypeNode(typeNode);
    return new Type({
      type,
      text: typeString,
      getReferences: () => getReferencesForTypeNode(typeNode, tag, analyzer),
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
  // Since getTypeAtLocation will return `any` for an untyped node, to support
  // jsdoc @type for JS (TBD), we look at the jsdoc type first.
  const jsdocType = ts.getJSDocType(node);
  return getTypeForType(
    jsdocType
      ? analyzer.program.getTypeChecker().getTypeFromTypeNode(jsdocType)
      : analyzer.program.getTypeChecker().getTypeAtLocation(node),
    node,
    analyzer
  );
};

/**
 * Converts a ts.Type into an analyzer Type object (which wraps
 * the ts.Type, but also provides analyzer Reference objects).
 */
const getTypeForType = (
  type: ts.Type,
  location: ts.Node,
  analyzer: AnalyzerInterface
): Type => {
  const checker = analyzer.program.getTypeChecker();
  // Ensure we treat inferred `foo = 'hi'` as 'string' not '"hi"'
  type = checker.getBaseTypeOfLiteralType(type);
  const text = checker.typeToString(type);
  const typeNode = checker.typeToTypeNode(
    type,
    location,
    ts.NodeBuilderFlags.IgnoreErrors
  );
  if (typeNode === undefined) {
    throw new DiagnosticsError(
      location,
      `Internal error: could not convert type to type node`
    );
  }
  return new Type({
    type,
    text,
    getReferences: () => getReferencesForTypeNode(typeNode, location, analyzer),
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
  const references: Reference[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isTypeReferenceNode(node)) {
      const name = getRootName(node.typeName);
      // TODO(kschaaf): we'd like to just do
      // `checker.getSymbolAtLocation(node)` to get the symbol, but it appears
      // that nodes created with `checker.typeToTypeNode()` do not have
      // associated symbols, so we need to look up by name via
      // `checker.getSymbolsInScope()`
      const symbol = getSymbolForName(name, location, analyzer);
      if (symbol === undefined) {
        throw new DiagnosticsError(
          location,
          `Could not get symbol for '${name}'.`
        );
      }
      references.push(getReferenceForSymbol(symbol, location, analyzer));
    } else if (ts.isImportTypeNode(node)) {
      if (!ts.isLiteralTypeNode(node.argument)) {
        throw new DiagnosticsError(node, 'Expected a string literal.');
      }
      const name = getRootName(node.qualifier);
      if (!ts.isStringLiteral(node.argument.literal)) {
        throw new DiagnosticsError(
          location,
          `Expected import specifier to be a string literal`
        );
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
    ts.forEachChild(node, visit);
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
    let modulePath = absoluteToPackage(specifier as AbsolutePath, rootDir);
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
  name: ts.Identifier | ts.QualifiedName | undefined
): string => {
  if (name === undefined) {
    return '';
  }
  if (ts.isQualifiedName(name)) {
    return getRootName(name.left);
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

const service = ts.createLanguageService(
  {
    getScriptFileNames: () => ['contents.ts'],
    getScriptVersion: () => contentsId.toString(),
    getScriptSnapshot: () => ts.ScriptSnapshot.fromString(contents),
    getCurrentDirectory: () => '',
    getCompilationSettings: () => ({include: ['contents.ts']}),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: () => true,
    readFile: () => undefined,
    readDirectory: () => [],
    directoryExists: () => true,
    getDirectories: () => [],
  },
  ts.createDocumentRegistry()
);

/**
 * Uses the stub LSH above to parse a type string and return a syntax-only
 * TypeNode (there will be no valid symbol information retrievable directly from
 * these nodes).
 */
const parseType = (typeString: string): ts.TypeNode | undefined => {
  // Update the file
  contents = `export type typeToParse = ${typeString}`;
  contentsId++;
  // Get a new program & parsed source file
  const sourceFile = service
    .getProgram()
    ?.getSourceFileByPath('contents.ts' as ts.Path);
  if (sourceFile === undefined) {
    return undefined;
  }
  // Find the type alias node and return it
  let typeNode: ts.TypeNode | undefined = undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      typeNode = node.type;
    }
  });
  return typeNode;
};
