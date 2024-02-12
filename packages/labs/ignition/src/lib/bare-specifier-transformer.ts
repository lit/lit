// A TypeScript transform that resolve bare module specifers to relative paths,
// with the Node module resolution algorithm.

import {resolve} from 'import-meta-resolve';
import ts from 'typescript';
import {getJsPathFromModulePath} from './paths.js';
import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {pathToFileURL, fileURLToPath} from 'url';

export const bareSpecifierTransformer =
  (analyzer: Analyzer, baseUrl: string) =>
  (context: ts.TransformationContext) =>
  (sourceFile: ts.SourceFile) => {
    const visitor: ts.Visitor = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        // console.log('isImportDeclaration', node.getText());
        const moduleSpecifier = node.moduleSpecifier;
        if (isBareSpecifier(moduleSpecifier)) {
          // console.log('isStringLiteral', moduleSpecifier.text);
          // console.log('sourceFile.fileName', sourceFile.fileName);
          const url = resolveSpecifier(
            sourceFile,
            analyzer,
            moduleSpecifier,
            baseUrl
          );

          return ts.factory.createImportDeclaration(
            node.modifiers,
            node.importClause,
            ts.factory.createStringLiteral(url),
            node.assertClause
          );
        }
      } else if (ts.isExportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (isBareSpecifier(moduleSpecifier)) {
          const url = resolveSpecifier(
            sourceFile,
            analyzer,
            moduleSpecifier,
            baseUrl
          );
          return ts.factory.createExportDeclaration(
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            ts.factory.createStringLiteral(url),
            node.assertClause
          );
        }
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };

const isNonRelativePath = (path: string) => {
  return path.startsWith('.') || path.startsWith('/');
};

const isBareSpecifier = (node?: ts.Expression): node is ts.StringLiteral => {
  return (
    node !== undefined &&
    ts.isStringLiteral(node) &&
    !isNonRelativePath(node.text)
  );
};
function resolveSpecifier(
  sourceFile: ts.SourceFile,
  analyzer: Analyzer,
  moduleSpecifier: ts.StringLiteral,
  baseUrl: string
) {
  const modulePath = sourceFile.fileName.endsWith('.js')
    ? sourceFile.fileName
    : getJsPathFromModulePath(analyzer, sourceFile.fileName as AbsolutePath);
  const moduleUrl = pathToFileURL(modulePath).href;
  // console.log('resolve', moduleSpecifier.text, moduleUrl);
  const resolvedPath = fileURLToPath(resolve(moduleSpecifier.text, moduleUrl));
  const pkg = analyzer.getPackage();
  const root = pkg.rootDir;

  if (!resolvedPath.startsWith(root)) {
    throw new Error(
      `Resolved path ${resolvedPath} is not contained in root ${root}`
    );
  }
  const rootRelativePath = resolvedPath.slice(
    root.endsWith('/') ? root.length : root.length + 1
  );
  const url = baseUrl + rootRelativePath;
  return url;
}
