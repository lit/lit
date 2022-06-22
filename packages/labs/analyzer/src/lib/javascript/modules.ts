/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Module} from '../model.js';
import * as path from 'path';
import {getClassDeclaration} from './classes.js';
import {getVariableDeclarations} from './variables.js';
import {ProgramContext} from '../program-context.js';
import {AbsolutePath, absoluteToPackage} from '../paths.js';

export const getModule = (
  sourceFile: ts.SourceFile,
  programContext: ProgramContext
) => {
  const sourcePath = absoluteToPackage(
    sourceFile.fileName as AbsolutePath,
    programContext.packageRoot
  );
  const fullSourcePath = path.join(programContext.packageRoot, sourcePath);
  const jsPath = ts
    .getOutputFileNames(programContext.commandLine, fullSourcePath, false)
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
      programContext.packageRoot as AbsolutePath
    ),
    sourceFile,
  });

  programContext.currentModule = module;

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      module.declarations.push(getClassDeclaration(statement, programContext));
    } else if (ts.isVariableStatement(statement)) {
      module.declarations.push(
        ...statement.declarationList.declarations
          .map((dec) => getVariableDeclarations(dec, dec.name, programContext))
          .flat()
      );
    }
  }
  programContext.currentModule = undefined;
  return module;
};
