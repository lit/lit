/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {AnalyzerContext, Package, PackageJson} from './model.js';
import {AbsolutePath} from './paths.js';
import * as fs from 'fs';
import * as path from 'path';
import {getModule} from './javascript/modules.js';
export {PackageJson};
import {DiagnosticsError} from './errors.js';

type FileCache = Map<string, {version: 0; content?: ts.IScriptSnapshot}>;

/**
 * An analyzer for Lit npm packages
 */
export class Analyzer {
  readonly packageRoot: AbsolutePath;
  context!: AnalyzerContext;

  private fileCache: FileCache = new Map();

  /**
   * @param packageRoot The root directory of the package to analyze. Currently
   * this directory must have a tsconfig.json and package.json.
   */
  constructor(packageRoot: AbsolutePath) {
    this.packageRoot = packageRoot;

    const configFileName = ts.findConfigFile(
      packageRoot,
      ts.sys.fileExists,
      'tsconfig.json'
    );
    if (configFileName === undefined) {
      // TODO: use a hard-coded tsconfig for JS projects.
      throw new Error(`tsconfig.json not found in ${packageRoot}`);
    }
    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    // Note `configFileName` is optional but must be set for
    // `getOutputFileNames` to work correctly; however, it must be relative to
    // `packageRoot`
    const commandLine = ts.parseJsonConfigFileContent(
      configFile.config /* json */,
      ts.sys /* host */,
      packageRoot /* basePath */,
      undefined /* existingOptions */,
      path.relative(packageRoot, configFileName) /* configFileName */
    );

    this.packageRoot = packageRoot;
    const service = ts.createLanguageService(
      createServiceHost(commandLine, this.fileCache),
      ts.createDocumentRegistry()
    );
    const program = service.getProgram()!;
    this.context = {
      commandLine,
      program,
      checker: program.getTypeChecker(),
      path,
      fs: ts.sys,
      log: (s) => console.log(s),
    };
    const diagnostics = this.context.program.getSemanticDiagnostics();
    if (diagnostics.length > 0) {
      throw new DiagnosticsError(
        diagnostics,
        `Error analyzing package '${this.packageRoot}': Please fix errors first`
      );
    }
  }

  analyzePackage() {
    const rootFileNames = this.context.program.getRootFileNames();

    const pkg = new Package({
      rootDir: this.packageRoot,
      modules: rootFileNames.map((fileName) =>
        getModule(this.context.program.getSourceFile(fileName)!, this.context)
      ),
    });

    return pkg;
  }
}

/**
 * Create a language service host that reads from the filesystem initially,
 * and supports updating individual source files in memory by updating its
 * content and version in the FileCache.
 */
const createServiceHost = (
  commandLine: ts.ParsedCommandLine,
  cache: FileCache
): ts.LanguageServiceHost => {
  return {
    getScriptFileNames: () => commandLine.fileNames,
    getScriptVersion: (fileName) =>
      cache.get(fileName)?.version.toString() ?? '-1',
    getScriptSnapshot: (fileName) => {
      let file = cache.get(fileName);
      if (file === undefined) {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }
        file = {
          version: 0,
          content: ts.ScriptSnapshot.fromString(
            fs.readFileSync(fileName, 'utf-8')
          ),
        };
        cache.set(fileName, file);
      }
      return file.content;
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => commandLine.options,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
};
