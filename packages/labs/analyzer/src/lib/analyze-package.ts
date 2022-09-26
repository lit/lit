import ts from 'typescript';
import {AbsolutePath} from './paths.js';
import * as path from 'path';
import {DiagnosticsError} from './errors.js';
import {Analyzer} from './analyzer.js';

/**
 * Returns an analyzer for a Lit npm package based on a filesystem path.
 */
export const createPackageAnalyzer = (packageRoot: AbsolutePath) => {
  const configFileName = ts.sys.directoryExists(packageRoot)
    ? path.join(packageRoot, 'tsconfig.json')
    : packageRoot;
  let commandLine: ts.ParsedCommandLine;
  if (ts.sys.fileExists(configFileName)) {
    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    commandLine = ts.parseJsonConfigFileContent(
      configFile.config /* json */,
      ts.sys /* host */,
      packageRoot /* basePath */,
      undefined /* existingOptions */,
      path.relative(packageRoot, configFileName) /* configFileName */
    );
  } else {
    console.info(`No tsconfig.json found; assuming package is JavaScript.`);
    commandLine = ts.parseJsonConfigFileContent(
      {
        compilerOptions: {
          module: 'esm',
          allowJs: true,
        },
        include: ['**/*.js'],
      },
      ts.sys /* host */,
      packageRoot /* basePath */
    );
  }

  const program = ts.createProgram(commandLine.fileNames, commandLine.options);

  const analyzer = new Analyzer({getProgram: () => program, fs: ts.sys, path});

  const diagnostics = program.getSemanticDiagnostics();
  if (diagnostics.length > 0) {
    throw new DiagnosticsError(
      diagnostics,
      `Error analyzing package '${packageRoot}': Please fix errors first`
    );
  }

  return analyzer;
};
