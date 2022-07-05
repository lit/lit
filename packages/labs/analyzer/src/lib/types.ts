/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {DiagnosticsError} from './errors.js';
import {Type, Reference, AnalyzerContext} from './model.js';
import {getReferenceForSymbol} from './references.js';

/**
 * Returns a ts.Symbol for a name in scope at a given location in the AST.
 * TODO(kschaaf): There are ~1748 symbols in scope of a typical hello world,
 * due to DOM globals. Perf might become an issue here. This is a reason to
 * look for a better Type visitor than typedoc:
 * https://github.com/lit/lit/issues/3001
 */
export const getSymbolForName = (
  name: string,
  location: ts.Node,
  context: AnalyzerContext
): ts.Symbol | undefined => {
  return context.checker
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
  context: AnalyzerContext
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
    const type = context.checker.getTypeFromTypeNode(typeNode);
    return new Type(
      type,
      typeString,
      getReferencesForTypeNode(typeNode, tag, context)
    );
  } else {
    return undefined;
  }
};

/**
 * Returns an analyzer `Type` object for the given AST node.
 */
export const getTypeForNode = (
  node: ts.Node,
  context: AnalyzerContext
): Type => {
  // Since getTypeAtLocation will return `any` for an untyped node, to support
  // jsdoc @type for JS (TBD), we look at the jsdoc type first.
  const jsdocType = ts.getJSDocType(node);
  return getTypeForType(
    jsdocType
      ? context.checker.getTypeFromTypeNode(jsdocType)
      : context.checker.getTypeAtLocation(node),
    node,
    context
  );
};

/**
 * Converts a ts.Type into an analyzer Type object (which wraps
 * the ts.Type, but also provides analyzer Reference objects).
 */
const getTypeForType = (
  type: ts.Type,
  location: ts.Node,
  context: AnalyzerContext
): Type => {
  const {checker} = context;
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
  return new Type(
    type,
    text,
    getReferencesForTypeNode(typeNode, location, context)
  );
};

const getReferencesForTypeNode = (
  typeNode: ts.TypeNode,
  location: ts.Node,
  context: AnalyzerContext
): Reference[] => {
  const references: Reference[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isTypeReferenceNode(node) || ts.isImportTypeNode(node)) {
      const name = getRootName(
        ts.isTypeReferenceNode(node) ? node.typeName : node.qualifier
      );
      // TODO(kschaaf): we'd like to just do
      // `checker.getSymbolAtLocation(node)` to get the symbol, but it appears
      // that nodes created with `checker.typeToTypeNode()` do not have
      // associated symbols, so we need to look up by name via
      // `checker.getSymbolsInScope()`
      const symbol = getSymbolForName(name, location, context);
      if (symbol === undefined) {
        throw new DiagnosticsError(
          location,
          `Could not get symbol for '${name}'.`
        );
      }
      references.push(getReferenceForSymbol(symbol, location, context));
    }
    ts.forEachChild(node, visit);
  };
  visit(typeNode);
  return references;
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

const parseType = (typeString: string): ts.TypeNode | undefined => {
  contents = `export type typeToParse = ${typeString}`;
  contentsId++;
  const sourceFile = service
    .getProgram()
    ?.getSourceFileByPath('contents.ts' as ts.Path);
  if (sourceFile === undefined) {
    return undefined;
  }
  let typeNode: ts.TypeNode | undefined = undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      typeNode = node.type;
    }
  });
  return typeNode;
};
