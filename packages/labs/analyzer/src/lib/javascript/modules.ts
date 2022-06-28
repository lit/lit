/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Module, Analyzer} from '../model.js';
import * as path from 'path';
import {getClassDeclaration} from './classes.js';
import {getVariableDeclarations} from './variables.js';
import {AbsolutePath, absoluteToPackage} from '../paths.js';
import {getFunctionDeclaration} from './functions.js';

export const getModule = (sourceFile: ts.SourceFile, analyzer: Analyzer) => {
  const sourcePath = absoluteToPackage(
    sourceFile.fileName as AbsolutePath,
    analyzer.packageRoot
  );
  const fullSourcePath = path.join(analyzer.packageRoot, sourcePath);
  const jsPath = ts
    .getOutputFileNames(analyzer.commandLine, fullSourcePath, false)
    .filter((f) => f.endsWith('.js'))[0];
  // TODO(kschaaf): this could happen if someone imported only a .d.ts file;
  // we might need to handle this differently
  if (jsPath === undefined) {
    throw new Error(`Could not determine output filename for '${sourcePath}'`);
  }

  const module = new Module({
    sourcePath,
    // The jsPath appears to come out of the ts API with unix
    // separators; since sourcePath uses OS separators, normalize
    // this so that all our model paths are OS-native
    jsPath: absoluteToPackage(
      path.normalize(jsPath) as AbsolutePath,
      analyzer.packageRoot as AbsolutePath
    ),
    sourceFile,
  });

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      module.declarations.push(getClassDeclaration(statement, analyzer));
    } else if (ts.isVariableStatement(statement)) {
      module.declarations.push(
        ...statement.declarationList.declarations
          .map((dec) => getVariableDeclarations(dec, dec.name, analyzer))
          .flat()
      );
    } else if (ts.isFunctionDeclaration(statement)) {
      module.declarations.push(
        getFunctionDeclaration(statement, statement.name!, analyzer)
      );
    }
  }

  return module;
};
