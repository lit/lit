/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import * as fs from 'fs';
import ts from 'typescript';
import {AbsolutePath, Analyzer} from '../index.js';

type Language = 'ts' | 'js';

export const languages: Language[] = ['ts', 'js'];

// Note these functions assume a specific setup in tsconfig.json for tests of TS
// projects using these helpers, namely that the `rootDir` is 'src' and the
// `outDir` is 'out'

export const getSourceFilename = (f: string, lang: Language) =>
  lang === 'ts'
    ? path.join(path.dirname(f), 'src', path.basename(f) + '.ts')
    : f + '.js';

export const getOutputFilename = (f: string, lang: Language) =>
  lang === 'ts'
    ? path.join(path.dirname(f), 'out', path.basename(f) + '.js')
    : f + '.js';

// The following code implements an InMemoryAnalyzer that uses a language
// service host backed by an updatable in-memory file cache, to allow for easy
// program invalidation in tests

/**
 * Map of filenames -> content
 */
export interface Files {
  [index: string]: string;
}

/**
 * Map of filenames -> versioned content
 */
interface Cache {
  [index: string]: {content: string; version: number};
}

/**
 * Common compiler options between TS & JS
 */
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020,
  lib: ['es2020', 'DOM'],
  module: ts.ModuleKind.ES2020,
  outDir: './',
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  experimentalDecorators: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  noEmit: true,
};

/**
 * JS-specific config
 */
const tsconfigJS = {
  ...compilerOptions,
  allowJs: true,
};

/**
 * TS-specific config
 */
const tsconfigTS = {
  ...compilerOptions,
  rootDir: '/src',
  outDir: '/',
  configFilePath: '/',
};

/**
 * Returns true if the file is a standard TS library. These are the only
 * files we read off of disk; everything else comes from the in-memory cache.
 */
const isLib = (fileName: string) =>
  fileName.includes('node_modules/typescript/lib');

/**
 * Simulates "reading" a directory from the in-memory cache. The cache stores a
 * flat list of filenames as keys, so this filters the list using a regex that
 * matches the given path, and returns a list of path segments immediately
 * following the directory (deduped using a Set, since if there are multiple
 * files in a subdirectory under this directory, the subdirectory name would
 * show up multiple times)
 */
const readDirectory = (cache: Cache, dir: AbsolutePath) => {
  const sep = dir.endsWith(path.sep) ? '' : '\\' + path.sep;
  const matcher = new RegExp(`^${path.normalize(dir)}${sep}([^${path.sep}]+)`);
  return Array.from(
    new Set(
      Object.keys(cache)
        .map((f) => f.match(matcher)?.[1])
        .filter((f) => !!f) as string[]
    )
  );
};

/**
 * Creates a ts.LanguageServiceHost that reads from an in-memory cache for all
 * files except TS standard libs, which are read off of disk.
 */
const createHost = (cache: Cache, lang: Language) => {
  return {
    getScriptFileNames: () =>
      Object.keys(cache).filter((s) => s.endsWith('.ts') || s.endsWith('.js')),
    getScriptVersion: (fileName: string) => cache[fileName].version.toString(),
    getScriptSnapshot: (fileName: string) => {
      if (isLib(fileName)) {
        return fs.existsSync(fileName)
          ? ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, 'utf-8'))
          : undefined;
      } else {
        return fileName in cache
          ? ts.ScriptSnapshot.fromString(cache[fileName].content)
          : undefined;
      }
    },
    getCurrentDirectory: () => '/',
    getCompilationSettings: () => (lang === 'ts' ? tsconfigTS : tsconfigJS),
    getDefaultLibFileName: (options: ts.CompilerOptions) =>
      ts.getDefaultLibFilePath(options),
    fileExists: (fileName: string) =>
      isLib(fileName) ? ts.sys.fileExists(fileName) : fileName in cache,
    readFile: (fileName: string) => cache[fileName].content,
    readDirectory: (fileName: string) =>
      readDirectory(cache, fileName as AbsolutePath),
    directoryExists: (dir: string) =>
      readDirectory(cache, dir as AbsolutePath).length > 0,
    getDirectories: () => [],
  };
};

/**
 * An Analyzer that analyzes an in-memory set of files passed into the
 * constructor, which may be updated after the fact using the `setFile()` API.
 */
export class InMemoryAnalyzer extends Analyzer {
  private _cache: Cache;
  private _dirty = false;
  private _lang: Language;

  constructor(lang: Language, files: Files = {}) {
    const cache: Cache = Object.fromEntries(
      Object.entries(files).map(([name, content]) => [
        name,
        {content, version: 0},
      ])
    );
    const host = createHost(cache, lang);
    const service = ts.createLanguageService(host, ts.createDocumentRegistry());
    let program: ts.Program;
    super({
      getProgram: () => {
        if (program === undefined || this._dirty) {
          this._dirty = false;
          program = service.getProgram()!;
        }
        return program;
      },
      fs: {
        ...host,
        useCaseSensitiveFileNames: false,
      },
      path,
    });
    this._cache = cache;
    this._lang = lang;
  }

  setFile(name: string, content: string) {
    const fileName = getSourceFilename(name, this._lang);
    const prev = this._cache[fileName] ?? {version: -1};
    this._cache[fileName] = {content, version: prev.version + 1};
    this._dirty = true;
  }
}
