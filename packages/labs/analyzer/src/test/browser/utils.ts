import {Analyzer, type AbsolutePath} from '../../index.js';
// import ts from '../../internal/typescript.js';
import type ts from 'typescript';
import * as path from 'path-module';

/**
 * Map of filenames -> versioned content
 */
interface Cache {
  [index: string]: {content: string; version: number};
}

/**
 * Map of filenames -> content
 */
export interface Files {
  [index: string]: string;
}

type Language = 'ts' | 'js';

export type TypeScript = typeof ts;

export type InMemoryAnalyzerInit = {
  typescript: TypeScript;
  lang: Language;
  files?: Files;
};

/**
 * An Analyzer that analyzes an in-memory set of files passed into the
 * constructor, which may be updated after the fact using the `setFile()` API.
 */
export class InMemoryAnalyzer extends Analyzer {
  private _cache: Cache;
  private _dirty = false;
  private _lang: Language;

  constructor({typescript, lang, files = {}}: InMemoryAnalyzerInit) {
    const ts = typescript;
    const cache: Cache = Object.fromEntries(
      Object.entries(files).map(([name, content]) => [
        name,
        {content, version: 0},
      ])
    );
    const host = createHost(typescript, cache, lang);
    const service = ts.createLanguageService(host, ts.createDocumentRegistry());
    let program: ts.Program;
    super({
      typescript,
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

// Note these functions assume a specific setup in tsconfig.json for tests of TS
// projects using these helpers, namely that the `rootDir` is 'src' and the
// `outDir` is 'out'

export const getSourceFilename = (f: string, lang: Language) =>
  path.normalize(
    lang === 'ts'
      ? path.join(path.dirname(f), 'src', path.basename(f) + '.ts')
      : f + '.js'
  );

export const getOutputFilename = (f: string, lang: Language) =>
  path.normalize(
    lang === 'ts'
      ? path.join(path.dirname(f), 'out', path.basename(f) + '.js')
      : path.normalize(f + '.js')
  );

/**
 * Creates a ts.LanguageServiceHost that reads from an in-memory cache for all
 * files except TS standard libs, which are read off of disk.
 */
const createHost = (typescript: TypeScript, cache: Cache, lang: Language) => {
  console.log('createHost', lang);
  return {
    getScriptFileNames: () =>
      Object.keys(cache).filter((s) => s.endsWith('.ts') || s.endsWith('.js')),
    getScriptVersion: (fileName: string) => cache[fileName].version.toString(),
    getScriptSnapshot: (fileName: string) => {
      if (isLib(fileName)) {
        return undefined;
      } else {
        return fileName in cache
          ? typescript.ScriptSnapshot.fromString(cache[fileName].content)
          : undefined;
      }
    },
    getCurrentDirectory: () => '/',
    getCompilationSettings: () =>
      lang === 'ts' ? getTsConfigTS(typescript) : getTsConfigJS(typescript),
    getDefaultLibFileName: (_options: ts.CompilerOptions) => {
      // TODO (justinfagnani): if we vend a supported in-memory analyzer, we
      // might need to include lib files somehow. We might want to throw here
      // for now.
      return 'lib.d.ts';
      //return  typescript.getDefaultLibFilePath(options),
    },
    fileExists: (fileName: string) => {
      // console.log('fileExists', fileName);
      return isLib(fileName)
        ? typescript.sys.fileExists(path.normalize(fileName))
        : fileName in cache;
    },
    readFile: (fileName: string) => cache[fileName].content,
    readDirectory: (fileName: string) =>
      readDirectory(cache, fileName as AbsolutePath),
    directoryExists: (dir: string) =>
      readDirectory(cache, dir as AbsolutePath).length > 0,
    getDirectories: () => [],
  } satisfies ts.LanguageServiceHost;
};

/**
 * Common compiler options between TS & JS
 */
const getBaseCompilerOptions = (ts: TypeScript): ts.CompilerOptions => ({
  target: ts.ScriptTarget.ES2020,
  lib: ['es2020', 'DOM'],
  module: ts.ModuleKind.ES2020,
  outDir: './',
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  experimentalDecorators: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  noEmit: true,
});

/**
 * JS-specific config
 */
const getTsConfigJS = (ts: TypeScript) => ({
  ...getBaseCompilerOptions(ts),
  allowJs: true,
  configFilePath: '/',
});

/**
 * TS-specific config
 */
const getTsConfigTS = (ts: TypeScript) => ({
  ...getBaseCompilerOptions(ts),
  rootDir: '/src',
  outDir: '/',
  configFilePath: '/',
});

/**
 * Simulates "reading" a directory from the in-memory cache. The cache stores a
 * flat list of filenames as keys, so this filters the list using a regex that
 * matches the given path, and returns a list of path segments immediately
 * following the directory (deduped using a Set, since if there are multiple
 * files in a subdirectory under this directory, the subdirectory name would
 * show up multiple times)
 */
const readDirectory = (cache: Cache, dir: AbsolutePath) => {
  const sep = dir.endsWith('/') ? '' : '\\/';
  const matcher = new RegExp(`^${dir}${sep}([^/]+)`);
  return Array.from(
    new Set(
      Object.keys(cache)
        .map((f) => f.match(matcher)?.[1])
        .filter((f) => !!f) as string[]
    )
  );
};

/**
 * Returns true if the file is a standard TS library. These are the only
 * files we read off of disk; everything else comes from the in-memory cache.
 */
const isLib = (fileName: string) =>
  fileName.includes('node_modules/typescript/lib');
