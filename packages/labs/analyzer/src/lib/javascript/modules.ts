/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Module, AnalyzerInterface, PackageInfo} from '../model.js';
import {
  isLitElement,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';
import * as path from 'path';
import {getClassDeclaration} from './classes.js';
import {getVariableDeclarations} from './variables.js';
import {AbsolutePath, absoluteToPackage} from '../paths.js';
import {getPackageInfo} from './packages.js';

/**
 * Returns an analyzer `Module` model for the given ts.SourceFile.
 */
export const getModule = (
  sourceFile: ts.SourceFile,
  analyzer: AnalyzerInterface,
  packageInfo: PackageInfo = getPackageInfo(
    sourceFile.fileName as AbsolutePath,
    analyzer
  )
) => {
  // Find and load the package.json associated with this module; this both gives
  // us the packageRoot for this module (needed for translating the source file
  // path to a package relative path), as well as the packageName (needed for
  // generating references to any symbols in this module). This will need
  // caching/invalidation.
  const {rootDir, packageJson} = packageInfo;
  const sourcePath = absoluteToPackage(
    analyzer.path.normalize(sourceFile.fileName) as AbsolutePath,
    rootDir
  );
  const fullSourcePath = path.join(rootDir, sourcePath);
  const jsPath = fullSourcePath.endsWith('.js')
    ? fullSourcePath
    : ts
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
      analyzer.path.normalize(jsPath) as AbsolutePath,
      rootDir
    ),
    sourceFile,
    packageJson,
  });

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      module.declarations.push(
        isLitElement(statement, analyzer)
          ? getLitElementDeclaration(statement, analyzer)
          : getClassDeclaration(statement, analyzer)
      );
    } else if (ts.isVariableStatement(statement)) {
      module.declarations.push(
        ...statement.declarationList.declarations
          .map((dec) => getVariableDeclarations(dec, dec.name, analyzer))
          .flat()
      );
    }
  }
  return module;
};
