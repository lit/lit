/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import 'source-map-support/register.js';
import ts from 'typescript/lib/tsserverlibrary.js';
import {
  AnalyzerContext,
  ClassDeclaration,
  getCommandLine,
  LitElementDeclaration,
} from '@lit-labs/analyzer/lib/model.js';
import {getReferenceForIdentifier} from '@lit-labs/analyzer/lib/references.js';
import path from 'path';

interface PluginContext extends AnalyzerContext {
  log: (s: string) => void;
}

function init(_modules: {
  typescript: typeof import('typescript/lib/tsserverlibrary');
}) {
  let program: ts.Program | undefined;
  let checker: ts.TypeChecker | undefined;
  let commandLine: ts.ParsedCommandLine | undefined;
  function create(info: ts.server.PluginCreateInfo) {
    let context: PluginContext;
    program = undefined;
    checker = undefined;
    const getContext = () => {
      if (context === undefined) {
        context = {
          get program() {
            return (program ??= info.languageService.getProgram()!);
          },
          get checker() {
            return (checker ??= this.program.getTypeChecker());
          },
          path,
          fs: ts.sys,
          get commandLine() {
            return (commandLine ??= getCommandLine(this.program, path));
          },
          log: (s: string) => info.project.projectService.logger.info(s),
        };
      }
      return context;
    };
    info.project.projectService.logger.info(
      '*** Lit analyzer tsserver plugin initialized'
    );

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
      const sourceFile = getContext().program.getSourceFileByPath(
        fileName.toLowerCase() as ts.Path
      );
      let result;
      if (sourceFile !== undefined) {
        result = getQuickInfoAtPosition(sourceFile, position, getContext());
      }
      return result ?? orig.getQuickInfoAtPosition(fileName, position);
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
    try {
      const model = getReferenceForIdentifier(
        identifier,
        context
      ).dereference();
      if (model !== undefined && model instanceof LitElementDeclaration) {
        return {
          kind: ts.ScriptElementKind.label,
          textSpan: {
            start: identifier.getStart(),
            length: identifier.getWidth(),
          },
          kindModifiers: '',
          displayParts: [
            {
              kind: 'text',
              text: `class ${model.name}`,
            },
          ],
          documentation: [
            {
              kind: 'text',
              text: `Custom element: &lt;${model.tagname}&gt;
              \n
              Heritage: ${getHeritage(model).join(' ← ')}`,
            },
          ],
        };
      }
    } catch (e) {
      console.log((e as Error)?.stack ?? (e as string));
      context.log((e as Error)?.stack ?? (e as string));
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

const getHeritage = (
  dec: ClassDeclaration | undefined,
  nameHint?: string
): string[] => {
  if (dec === undefined) {
    return [];
  }
  const heritage = dec.heritage;
  return [
    nameHint ?? dec.name ?? '?',
    ...heritage.mixins
      .map((mixin) =>
        getHeritage(mixin.dereference()?.classDeclaration, mixin.name)
      )
      .flat(),
    ...getHeritage(heritage.superClass?.dereference()),
  ];
};
