import ts from 'typescript';
import {AbsolutePath} from './paths.js';
import * as path from 'path';
import {DiagnosticsError} from './errors.js';
import {Analyzer} from './analyzer.js';

/**
 * Returns an analyzer for a Lit npm package based on a filesystem path.
 *
 * The path may specify a package root folder, or a specific tsconfig file. When
 * specifying a folder, if no tsconfig.json file is found directly in the root
 * folder, the project will be analyzed as JavaScript.
 */
export const createPackageAnalyzer = (packagePath: AbsolutePath) => {
  // This logic accepts either a path to folder containing a tsconfig.json
  // directly inside it or a path to a specific tsconfig file. If no tsconfig
  // file is found, we fallback to creating a Javascript program.
  const isDirectory = ts.sys.directoryExists(packagePath);
  const configFileName = isDirectory
    ? path.join(packagePath, 'tsconfig.json')
    : packagePath;
  let commandLine: ts.ParsedCommandLine;
  if (ts.sys.fileExists(configFileName)) {
    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    commandLine = ts.parseJsonConfigFileContent(
      configFile.config /* json */,
      ts.sys /* host */,
      packagePath /* basePath */,
      undefined /* existingOptions */,
      path.relative(packagePath, configFileName) /* configFileName */
    );
  } else if (isDirectory) {
    console.info(`No tsconfig.json found; assuming package is JavaScript.`);
    commandLine = ts.parseJsonConfigFileContent(
      {
        compilerOptions: {
          // TODO(kschaaf): probably want to make this configurable
          module: 'ES2020',
          lib: ['es2020', 'DOM'],
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
      },
      ts.sys /* host */,
      packagePath /* basePath */
    );
  } else {
    throw new Error(
      `The specified path '${packagePath}' was not a folder or a tsconfig file.`
    );
  }

  // Ensure that `parent` nodes are set in the AST by creating a compiler
  // host with this configuration; without these, `getText()` and other
  // API's that require crawling up the AST tree to find the source file
  // text may fail
  const compilerHost = ts.createCompilerHost(
    commandLine.options,
    /* setParentNodes */ true
  );
  const program = ts.createProgram(
    commandLine.fileNames,
    commandLine.options,
    compilerHost
  );

  const analyzer = new Analyzer({getProgram: () => program, fs: ts.sys, path});

  const diagnostics = program.getSemanticDiagnostics();
  if (diagnostics.length > 0) {
    throw new DiagnosticsError(
      diagnostics,
      `Error analyzing package '${packagePath}': Please fix errors first`
    );
  }

  return analyzer;
};
