import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';

export function getModulePathFromJsPath(
  analyzer: Analyzer,
  jsPath: AbsolutePath
) {
  const typescript = analyzer.typescript;
  const program = analyzer.program;
  const rootFileNames = program.getRootFileNames();

  // TODO: cache these results
  for (const fileName of rootFileNames) {
    const outputFileNames = typescript.getOutputFileNames(
      analyzer.commandLine,
      fileName,
      false
    );
    const jsOutputPath = outputFileNames.filter((f) => f.endsWith('.js'))[0];
    if (jsOutputPath === jsPath) {
      return fileName;
    }
  }
}

export function getJsPathFromModulePath(
  analyzer: Analyzer,
  modulePath: AbsolutePath
) {
  const typescript = analyzer.typescript;
  const program = analyzer.program;
  const outputFileNames = typescript.getOutputFileNames(
    analyzer.commandLine,
    modulePath,
    false
  );
  return outputFileNames.filter((f) => f.endsWith('.js'))[0];
}
