import ts from 'typescript';
import {AbsolutePath} from './paths.js';
import * as path from 'path';
import {DiagnosticsError} from './errors.js';
import {Analyzer} from './analyzer.js';

/**
 * Returns an analyzer for a Lit npm package based on a filesystem path.
 */
export const createPackageAnalyzer = (packageRoot: AbsolutePath) => {
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
