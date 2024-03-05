/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {AbsolutePath} from './paths.js';
import * as path from 'path';
import {Analyzer} from './analyzer.js';
import type {AnalyzerInterface} from './model.js';

export interface AnalyzerOptions {
  /**
   * Glob of source files to exclude from project during analysis.
   *
   * Useful for excluding things source like test folders that might otherwise
   * be included in a project's tsconfig.
   */
  exclude?: string[];
  fs?: AnalyzerInterface['fs'];
}

const getCommandLine = (
  packagePath: AbsolutePath,
  options: AnalyzerOptions,
  fs: AnalyzerInterface['fs']
): ts.ParsedCommandLine => {
  // This logic accepts either a path to folder containing a tsconfig.json
  // directly inside it or a path to a specific tsconfig file. If no tsconfig
  // file is found, we fallback to creating a JavaScript program.
  const isDirectory = ts.sys.directoryExists(packagePath);
  const configFileName = isDirectory
    ? path.join(packagePath, 'tsconfig.json')
    : packagePath;
  if (fs.fileExists(configFileName)) {
    const configFile = ts.readConfigFile(configFileName, (path) =>
      fs.readFile(path)
    );
    if (options.exclude !== undefined) {
      (configFile.config.exclude ??= []).push(...options.exclude);
    }
    return ts.parseJsonConfigFileContent(
      configFile.config /* json */,
      fs /* host */,
      isDirectory ? packagePath : path.dirname(packagePath) /* basePath */,
      {} /* existingOptions */,
      configFileName /* configFileName */
    );
  } else if (isDirectory) {
    console.info(`No tsconfig.json found; assuming package is JavaScript.`);
    return ts.parseJsonConfigFileContent(
      {
        compilerOptions: {
          // TODO(kschaaf): probably want to make this configurable
          module: 'es2021',
          lib: ['es2021', 'DOM'],
          allowJs: true,
          skipLibCheck: true,
          skipDefaultLibCheck: true,
          // With `allowJs: true`, the program will automatically include every
          // .d.ts file under node_modules/@types regardless of whether the
          // program imported modules associated with those types, which can
          // dramatically slow down the program analysis (this does not
          // automatically happen when allowJs is false). For now, eliminating
          // `typeRoots` fixes the automatic over-inclusion of .d.ts files as
          // long as nodeResolution is properly set (it will still import .d.ts
          // files into the project as expected based on imports). It may
          // however cause a failure to find definitely-typed .d.ts files for
          // imports in a JS project, but it seems unlikely these would be
          // installed anyway.
          typeRoots: [],
          moduleResolution: 'node',
        },
        include: ['**/*.js'],
        exclude: options.exclude ?? [],
      },
      fs /* host */,
      packagePath /* basePath */
    );
  } else {
    throw new Error(
      `The specified path '${packagePath}' was not a folder or a tsconfig file.`
    );
  }
};

/**
 * Returns an analyzer for a Lit npm package based on a filesystem path.
 *
 * The path may specify a package root folder, or a specific tsconfig file. When
 * specifying a folder, if no tsconfig.json file is found directly in the root
 * folder, the project will be analyzed as JavaScript.
 *
 * The returned analyzer will be immutable and will not update as the filesystem
 * changes. This is useful for analyzing a package at a specific point in time,
 * for example as part of a build pipeline.
 */
export const createPackageAnalyzer = (
  packagePath: AbsolutePath,
  options: AnalyzerOptions = {}
) => {
  const fs = options.fs ?? ts.sys;
  const commandLine = getCommandLine(packagePath, options, fs);

  const compilerHost = ts.createCompilerHost(
    commandLine.options,
    // Ensure that `parent` nodes are set in the AST by creating a compiler
    // host with this configuration; without these, `getText()` and other
    // API's that require crawling up the AST tree to find the source file
    // text may fail
    /* setParentNodes */ true
  );
  const program = ts.createProgram(
    commandLine.fileNames,
    commandLine.options,
    compilerHost,
    undefined,
    commandLine.errors
  );

  const analyzer = new Analyzer({
    getProgram: () => program,
    typescript: ts,
    fs: ts.sys,
    path,
    commandLine,
  });
  for (const diagnostic of program.getSyntacticDiagnostics()) {
    analyzer.addDiagnostic(diagnostic);
  }

  return analyzer;
};

/**
 * Like createPackageAnalyzer, only it the returned analyzer uses filesystem
 * mtimes to notice when files have updated, and will automatically give
 * fresh results when queried.
 */
export const createUpdatingPackageAnalyzer = (
  packagePath: AbsolutePath,
  options: AnalyzerOptions = {}
) => {
  const fs = options.fs ?? ts.sys;
  const commandLine = getCommandLine(packagePath, options, fs);

  const languageService = ts.createLanguageService({
    getCompilationSettings: function (): ts.CompilerOptions {
      return commandLine.options;
    },
    getScriptFileNames: function (): string[] {
      return commandLine.fileNames;
    },
    getScriptVersion: function (fileName: string): string {
      const mTime = fs.getModifiedTime?.(fileName)?.valueOf().toString() ?? '0';
      return mTime;
    },
    getScriptSnapshot: function (
      fileName: string
    ): ts.IScriptSnapshot | undefined {
      const text = fs.readFile(fileName, 'utf-8');
      if (text === undefined) {
        return undefined;
      }
      return ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: function (): string {
      return packagePath;
    },
    getDefaultLibFileName: function (options: ts.CompilerOptions): string {
      return ts.getDefaultLibFilePath(options);
    },
    readFile: function (
      path: string,
      encoding?: string | undefined
    ): string | undefined {
      return fs.readFile(path, encoding);
    },
    fileExists: function (path: string): boolean {
      return fs.fileExists(path);
    },
  });

  const analyzer = new Analyzer({
    getProgram: () => languageService.getProgram()!,
    typescript: ts,
    fs,
    path,
    commandLine,
  });
  for (const diagnostic of analyzer.program.getSyntacticDiagnostics()) {
    analyzer.addDiagnostic(diagnostic);
  }

  return analyzer;
};
