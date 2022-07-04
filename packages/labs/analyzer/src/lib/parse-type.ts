/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

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

export const parseType = (typeString: string): ts.TypeNode | undefined => {
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
