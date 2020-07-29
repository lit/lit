/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
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
  transformers?: ts.CustomTransformers
): CompileResult {
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

  let outputCode = '';
  host.writeFile = (name, data) => {
    if (name === dummyJsFilename) {
      outputCode = data;
    } else {
      throw new Error('Did not expect to write file other than dummy JS');
    }
  };

  const program = ts.createProgram([dummyTsFilename], options, host);
  const emitResult = program.emit(
    undefined,
    undefined,
    undefined,
    undefined,
    transformers
  );
  return {
    code: outputCode,
    diagnostics: emitResult.diagnostics.concat(
      ts.getPreEmitDiagnostics(program)
    ),
  };
}
