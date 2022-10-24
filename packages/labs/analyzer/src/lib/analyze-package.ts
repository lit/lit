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
  // file is found, we fallback to creating a JavaScript program.
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
          module: 'esm',
          allowJs: true,
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

  const program = ts.createProgram(commandLine.fileNames, commandLine.options);

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
