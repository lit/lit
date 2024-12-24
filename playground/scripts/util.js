import {readFile, readdir} from 'fs/promises';
import {
  createSourceFile,
  ScriptTarget,
  forEachChild,
  isImportDeclaration,
  isStringLiteral,
} from 'typescript';

export function getPackageFromSpecifier(specifier) {
  const parts = specifier.split('/');
  return parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
}

async function getModuleSpecifiersFromFile(filePath) {
  const fileContent = await readFile(filePath, {
    encoding: 'utf-8',
  });

  const sourceFile = createSourceFile(
    filePath,
    fileContent,
    ScriptTarget.Latest,
    true
  );

  const specifiers = [];

  forEachChild(sourceFile, (node) => {
    if (isImportDeclaration(node)) {
      const {moduleSpecifier} = node;
      if (isStringLiteral(moduleSpecifier)) {
        specifiers.push(moduleSpecifier.text);
      } else {
        console.warn(`Non-literal module specifier: ${moduleSpecifier}`);
      }
    }
  });

  return specifiers;
}

async function getBareModuleSpecifiersFromFile(filePath) {
  return (await getModuleSpecifiersFromFile(filePath)).filter(
    (file) => !file.match(/^[./]/)
  );
}

export async function getBareModuleSpecifiersFromDir(dir) {
  if (dir !== undefined) {
    process.chdir(dir);
  }
  const sourceFiles = (await readdir('.')).filter(
    (file) => file.endsWith('.ts') || file.endsWith('.js')
  );

  const importedSpecifiers = new Set();

  for (const file of sourceFiles) {
    (await getBareModuleSpecifiersFromFile(file)).forEach((specifier) =>
      importedSpecifiers.add(specifier)
    );
  }

  return Array.from(importedSpecifiers);
}

///

export function isLitSpecifier(specifier) {
  return (
    specifier === 'lit' ||
    specifier === 'lit-html' ||
    specifier === 'lit-element' ||
    specifier.startsWith('lit/') ||
    specifier.startsWith('lit-html/') ||
    specifier.startsWith('lit-element/') ||
    specifier.startsWith('@lit/') ||
    specifier.startsWith('@lit-labs/')
  );
}

///

export function normalizePath(path) {
  return path.startsWith('p/') ? path : `p/${path}`;
}
