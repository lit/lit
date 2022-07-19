/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {
  AnalyzerContext,
  Declaration,
  ManifestJson,
  Module,
  PackageJson,
} from '../model.js';
import * as path from 'path';
import {
  getClassDeclaration,
  getClassDeclarationFromManifest,
} from './classes.js';
import {getVariableDeclarations} from './variables.js';
import {AbsolutePath, absoluteToPackage, PackagePath} from '../paths.js';
import {getFunctionDeclaration} from './functions.js';
import {DiagnosticsError} from '../errors.js';

const sourceModuleCache = new WeakMap<ts.SourceFile, Module>();
const manifestModuleCache = new Map<string, Module>();

const getPackageRootForModulePath = (
  modulePath: AbsolutePath,
  context: AnalyzerContext
): AbsolutePath => {
  // TODO(kschaaf): Add caching
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
  // TODO(kschaaf): Add caching
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
    }
    sourceModuleCache.delete(sourceFile);
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
  const sourcePath = absoluteToPackage(fileName, packageRoot);
  if (isSourceFileInProgram(sourceFile, context)) {
    const jsPath = ts
      .getOutputFileNames(context.commandLine, fileName, false)
      .filter((f) => f.endsWith('.js'))[0];
    // TODO(kschaaf): this could happen if someone imported only a .d.ts file;
    // we might need to handle this differently
    if (jsPath === undefined) {
      throw new Error(
        `Could not determine output filename for '${sourcePath}'`
      );
    }
    const dependencies = new Set<string>();
    const declarationMap = new Map<string, Declaration | (() => Declaration)>();
    for (const statement of sourceFile.statements) {
      if (ts.isClassDeclaration(statement)) {
        const name =
          statement.name?.text ??
          (statement.modifiers?.some(
            (s) => s.kind === ts.SyntaxKind.DefaultKeyword
          )
            ? 'default'
            : undefined);
        if (name === undefined) {
          throw new DiagnosticsError(
            statement,
            `Internal error: Expected name for statmeent`
          );
        }
        declarationMap.set(name, () => getClassDeclaration(statement, context));
      } else if (ts.isVariableStatement(statement)) {
        for (const [
          name,
          getVariableDeclaration,
        ] of statement.declarationList.declarations
          .map((dec) => getVariableDeclarations(dec, dec.name, context))
          .flat()) {
          declarationMap.set(name, getVariableDeclaration);
        }
      } else if (ts.isFunctionDeclaration(statement)) {
        declarationMap.set(
          statement.name?.text ?? '',
          getFunctionDeclaration(statement, statement.name!, context)
        );
      } else if (ts.isImportDeclaration(statement)) {
        dependencies.add(statement.moduleSpecifier.getText().slice(1, -1));
      }
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
      getExport: (name: string) => {
        let dec = declarationMap.get(name);
        if (dec === undefined) {
          throw new Error(
            `No export named '${name}' in module '${sourcePath}'`
          );
        }
        if (typeof dec === 'function') {
          dec = (dec as () => Declaration)();
          declarationMap.set(name, dec);
        }
        return dec as Declaration;
      },
      getDeclarations: () => {
        const declarations = [];
        for (const [, dec] of declarationMap) {
          declarations.push(typeof dec === 'function' ? dec() : dec);
        }
        return declarations;
      },
    });
    sourceModuleCache.set(sourceFile, module);
  } else {
    importPackageFromManifest(packageRoot, packageJson, context);
    module =
      manifestModuleCache.get(fileName.replace(/.d.ts$/, '.js')) ??
      new Module({
        sourcePath,
        jsPath: sourcePath,
        packageJson,
        getDeclarations: () => [],
        getExport: (name: string) => {
          throw new Error(
            `Cannot get export '${name}' from module ${sourcePath}; no manifest existed for this module.`
          );
        },
      });
  }
  return module;
};

const importPackageFromManifest = (
  packageRoot: AbsolutePath,
  packageJson: PackageJson,
  context: AnalyzerContext
) => {
  if (packageJson.customElements === undefined) {
    return;
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
  const declarations =
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
    }) ?? [];
  const declarationsMap = new Map(declarations.map((d) => [d.name, d]));
  const jsPath = manifestModule.path as PackagePath;
  const module = new Module({
    jsPath,
    sourcePath: jsPath,
    packageJson,
    getExport: (name: string) => {
      const dec = declarationsMap.get(name);
      if (dec === undefined) {
        throw new Error(`No export named '${name}' in module '${jsPath}'`);
      }
      return dec;
    },
    getDeclarations: () => declarations,
  });
  return module;
};
