/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {AnalyzerContext, ManifestJson, Module, PackageJson} from '../model.js';
import * as path from 'path';
import {
  getClassDeclaration,
  getClassDeclarationFromManifest,
} from './classes.js';
import {getVariableDeclarations} from './variables.js';
import {AbsolutePath, absoluteToPackage, PackagePath} from '../paths.js';
import {getFunctionDeclaration} from './functions.js';

const sourceModuleCache = new WeakMap<ts.SourceFile, Module>();
const manifestModuleCache = new Map<string, Module>();

const getPackageRootForModulePath = (
  modulePath: AbsolutePath,
  context: AnalyzerContext
): AbsolutePath => {
  const {fs, path} = context;
  let searchDir = path.dirname(modulePath);
  const root = path.parse(searchDir).root;
  while (searchDir !== root) {
    if (fs.fileExists(path.join(searchDir, 'package.json'))) {
      return searchDir as AbsolutePath;
    }
    searchDir = path.dirname(searchDir);
  }
  throw new Error(`No package.json found for module path ${modulePath}`);
};

const getPackageJsonFromPackageRoot = (
  packageRoot: AbsolutePath,
  context: AnalyzerContext
): PackageJson => {
  const {fs, path} = context;
  const packageJson = fs.readFile(path.join(packageRoot, 'package.json'));
  if (packageJson !== undefined) {
    return JSON.parse(packageJson) as PackageJson;
  }
  throw new Error(`No package.json found at ${packageRoot}`);
};

const getAndValidateModuleFromCache = (
  sourceFile: ts.SourceFile,
  context: AnalyzerContext
): Module | undefined => {
  const module = sourceModuleCache.get(sourceFile);
  if (module !== undefined && module.sourceFile === sourceFile) {
    if (
      Array.from(module.dependencies).every((path) => {
        const sourceFile = context.program.getSourceFileByPath(path as ts.Path);
        return sourceFile
          ? getAndValidateModuleFromCache(sourceFile, context)
          : true;
      })
    ) {
      return module;
    } else {
      sourceModuleCache.delete(sourceFile);
    }
  }
  return undefined;
};

const programFileNameCache = new WeakMap<ts.Program, Set<string>>();
const isSourceFileInProgram = (
  sourceFile: ts.SourceFile,
  context: AnalyzerContext
) => {
  let fileNameCache = programFileNameCache.get(context.program);
  if (fileNameCache === undefined) {
    fileNameCache = new Set(context.program.getRootFileNames());
    programFileNameCache.set(context.program, fileNameCache);
  }
  return fileNameCache.has(sourceFile.fileName);
};

export const getModule = (
  sourceFile: ts.SourceFile,
  context: AnalyzerContext
): Module => {
  const fileName = sourceFile.fileName as AbsolutePath;
  let module = getAndValidateModuleFromCache(sourceFile, context);
  if (module !== undefined) {
    return module;
  }
  const packageRoot = getPackageRootForModulePath(fileName, context);
  const packageJson = getPackageJsonFromPackageRoot(packageRoot, context);
  if (!isSourceFileInProgram(sourceFile, context)) {
    importPackageFromManifest(packageRoot, packageJson, context);
    const module = manifestModuleCache.get(fileName.replace(/.d.ts$/, '.js'));
    if (module === undefined) {
      throw new Error(
        `Expected external module ${packageRoot} to have a custom-elements.json containing module ${sourceFile.fileName}`
      );
    }
    return module;
  }
  const sourcePath = absoluteToPackage(fileName, packageRoot);
  const jsPath = ts
    .getOutputFileNames(context.commandLine, fileName, false)
    .filter((f) => f.endsWith('.js'))[0];
  // TODO(kschaaf): this could happen if someone imported only a .d.ts file;
  // we might need to handle this differently
  if (jsPath === undefined) {
    throw new Error(`Could not determine output filename for '${sourcePath}'`);
  }
  module = new Module({
    sourcePath,
    // The jsPath appears to come out of the ts API with unix
    // separators; since sourcePath uses OS separators, normalize
    // this so that all our model paths are OS-native
    jsPath: absoluteToPackage(
      path.normalize(jsPath) as AbsolutePath,
      packageRoot
    ),
    sourceFile,
    packageJson,
  });

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement)) {
      module.declarations.push(getClassDeclaration(statement, context));
    } else if (ts.isVariableStatement(statement)) {
      module.declarations.push(
        ...statement.declarationList.declarations
          .map((dec) => getVariableDeclarations(dec, dec.name, context))
          .flat()
      );
    } else if (ts.isFunctionDeclaration(statement)) {
      module.declarations.push(
        getFunctionDeclaration(statement, statement.name!, context)
      );
    } else if (ts.isImportDeclaration(statement)) {
      module.dependencies.add(statement.moduleSpecifier.getText().slice(1, -1));
    }
  }

  return module;
};

const importPackageFromManifest = (
  packageRoot: AbsolutePath,
  packageJson: PackageJson,
  context: AnalyzerContext
) => {
  if (packageJson.customElements === undefined) {
    throw new Error(
      `Expected ${context.path.join(
        packageRoot,
        'package.json'
      )} to have a 'customElements' field.}`
    );
  }
  const manifestJson = context.fs.readFile(
    context.path.join(packageRoot, packageJson.customElements)
  );
  if (manifestJson === undefined) {
    throw new Error(
      `Could not read custom elements manifest '${
        packageJson.customElements
      }' in specified in package ${packageJson.name ?? packageRoot}`
    );
  }
  const manifest = JSON.parse(manifestJson) as ManifestJson.Package;
  for (const manifestModule of manifest.modules) {
    const module = getModuleFromManifest(manifestModule, packageJson);
    manifestModuleCache.set(
      context.path.join(packageRoot, module.jsPath),
      module
    );
  }
};

const getModuleFromManifest = (
  manifestModule: ManifestJson.Module,
  packageJson: PackageJson
): Module => {
  const module = new Module({
    jsPath: manifestModule.path as PackagePath,
    sourcePath: manifestModule.path as PackagePath,
    packageJson,
    declarations:
      manifestModule.declarations?.map((dec) => {
        switch (dec.kind) {
          case 'class':
            return getClassDeclarationFromManifest(dec);
          case 'function':
          case 'mixin':
          case 'variable':
          default:
            throw new Error(
              `Unhandled custom-elements.json manifest type ${dec.kind}`
            );
        }
      }) ?? [],
  });
  return module;
};
