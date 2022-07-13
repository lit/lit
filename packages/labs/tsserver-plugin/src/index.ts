/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript/lib/tsserverlibrary.js';
import {
  AnalyzerContext,
  getCommandLine,
  LitElementDeclaration,
} from '@lit-labs/analyzer/lib/model.js';
import {getModelForIdentifier} from '@lit-labs/analyzer/lib/references.js';
import path from 'path';

interface PluginContext extends AnalyzerContext {
  log: (s: string) => void;
}

function init(_modules: {
  typescript: typeof import('typescript/lib/tsserverlibrary');
}) {
  function create(info: ts.server.PluginCreateInfo) {
    const program = info.languageService.getProgram()!;
    const checker = program.getTypeChecker();
    const context: PluginContext = {
      program,
      checker,
      path,
      fs: ts.sys,
      commandLine: getCommandLine(program, path),
      log: (s: string) => info.project.projectService.logger.info(s),
    };
    context.log('Lit analyzer tsserver plugin initialized');

    // Set up decorator object
    const orig = info.languageService;
    const service: ts.LanguageService = Object.create(null);
    for (const k of Object.keys(orig) as Array<keyof ts.LanguageService>) {
      const x = orig[k]!;
      // @ts-expect-error - JS runtime trickery which is tricky to type tersely
      service[k] = (...args: Array<{}>) => x.apply(orig, args);
    }

    // Remove specified entries from completion list
    service.getQuickInfoAtPosition = (fileName: ts.Path, position: number) => {
      const sourceFile = program.getSourceFileByPath(fileName);
      return (
        (sourceFile && getQuickInfoAtPosition(sourceFile, position, context)) ??
        orig.getQuickInfoAtPosition(fileName, position)
      );
    };

    return service;
  }

  return {create};
}

export = init;

const getQuickInfoAtPosition = (
  sourceFile: ts.SourceFile,
  position: number,
  context: PluginContext
): ts.QuickInfo | undefined => {
  context.log(`Looking for identifier at ${position}`);
  const identifier = getIdentifierAtPosition(sourceFile, position);
  if (identifier !== undefined) {
    context.log(`Found identifier ${identifier.text}}`);
    const model = getModelForIdentifier(identifier, context);
    if (model !== undefined) {
      return {
        kind: ts.ScriptElementKind.label,
        textSpan: {start: identifier.getStart(), length: identifier.getWidth()},
        kindModifiers: '',
        displayParts: [
          {
            kind: 'text',
            text: `Tag name for custom elemenent: ${
              (model as LitElementDeclaration).tagname
            }`,
          },
        ],
      };
    }
  }
  return undefined;
};

const getIdentifierAtPosition = (
  sourceFile: ts.SourceFile,
  position: number
): ts.Identifier | undefined => {
  const visit = (node: ts.Node): ts.Identifier | undefined => {
    if (
      ts.isIdentifier(node) &&
      position >= node.getStart() &&
      position <= node.getEnd()
    ) {
      return node;
    }
    return ts.forEachChild(node, visit);
  };
  return visit(sourceFile);
};
