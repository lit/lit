/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';

/**
 * Filesystem caching for the TypeScript CompilerHost implementation used in
 * `compileTsFragment`. Shared across multiple invocations to significantly
 * speed up the loading of common files (e.g. TypeScript core lib d.ts files).
 * Assumes files on disk never change.
 */
export class CompilerHostCache {
  fileExists = new Map<string, boolean>();
  readFile = new Map<string, string | undefined>();
  getDirectories = new Map<string, string[]>();
  getSourceFile = new Map<string, ts.SourceFile | undefined>();
}

/**
 * The return type of `compileTsFragment`.
 */
export interface CompileResult {
  /** The compiled code. */
  code: string;
  /** Errors and warnings from compilation. */
  diagnostics: ts.Diagnostic[];
}

/**
 * Compile a fragment of TypeScript source code with the given options and
 * optional transformers.
 */
export function compileTsFragment(
  inputCode: string,
  options: ts.CompilerOptions,
  cache: CompilerHostCache,
  transformers?: (program: ts.Program) => ts.CustomTransformers
): CompileResult {
  let outputCode = '';
  const {program} = createTsProgramFromFragment(
    inputCode,
    options,
    cache,
    (code: string) => (outputCode = code)
  );
  const emitResult = program.emit(
    undefined,
    undefined,
    undefined,
    undefined,
    transformers ? transformers(program) : undefined
  );
  return {
    code: outputCode,
    diagnostics: emitResult.diagnostics.concat(
      ts.getPreEmitDiagnostics(program)
    ),
  };
}

/**
 * Create a TypeScript program from a fragment of TypeScript source code. If
 * this program is compiled, output for the fragment will be passed to
 * `writeFileCallback`.
 */
export function createTsProgramFromFragment(
  inputCode: string,
  options: ts.CompilerOptions,
  cache: CompilerHostCache,
  writeFileCallback: (code: string) => void
): {host: ts.CompilerHost; program: ts.Program} {
  const dummyTsFilename = '__DUMMY__.ts';
  const dummyJsFilename = '__DUMMY__.js';
  const dummySourceFile = ts.createSourceFile(
    dummyTsFilename,
    inputCode,
    ts.ScriptTarget.Latest
  );

  // Patch this host to [1] hallucinate our code fragment as a virtual file and
  // intercept its compiled output, and [2] use the cache for real filesystem
  // operations.
  const host = ts.createCompilerHost(options);

  const realFileExists = host.fileExists.bind(host);
  host.fileExists = (name) => {
    if (name === dummyTsFilename) {
      return true;
    }
    let exists = cache.fileExists.get(name);
    if (exists === undefined) {
      exists = realFileExists(name);
      cache.fileExists.set(name, exists);
    }
    return exists;
  };

  const realReadFile = host.readFile.bind(host);
  host.readFile = (name) => {
    if (name === dummyTsFilename) {
      return inputCode;
    }
    if (cache.readFile.has(name)) {
      return cache.readFile.get(name);
    }
    const data = realReadFile(name);
    cache.readFile.set(name, data);
    return data;
  };

  const realGetDirectories = host.getDirectories?.bind(host);
  host.getDirectories = (path) => {
    if (!realGetDirectories) {
      return [];
    }
    let dirs = cache.getDirectories.get(path);
    if (dirs === undefined) {
      dirs = realGetDirectories(path);
      cache.getDirectories.set(path, dirs);
    }
    return dirs;
  };

  const realGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, ...args) => {
    if (name === dummyTsFilename) {
      return dummySourceFile;
    }
    let file = cache.getSourceFile.get(name);
    if (file === undefined) {
      file = realGetSourceFile(name, ...args);
      cache.getSourceFile.set(name, file);
    }
    return file;
  };

  host.writeFile = (name, data) => {
    if (name === dummyJsFilename) {
      writeFileCallback(data);
    } else {
      throw new Error('Did not expect to write file other than dummy JS');
    }
  };

  const program = ts.createProgram([dummyTsFilename], options, host);
  return {program, host};
}
