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
  getCommandLineFromProgram,
  LitElementDeclaration,
} from '@lit-labs/analyzer/lib/model.js';
import {getReferenceForIdentifier} from '@lit-labs/analyzer/lib/references.js';
import {getModule} from '@lit-labs/analyzer/lib/javascript/modules.js';
import {getTemplateModelAtPosition} from '@lit-labs/analyzer/lib/lit-html/template-result.js';
import path from 'path';
import * as util from 'util';

interface PluginContext extends AnalyzerContext {
  log: (s: string) => void;
}

const memoMap = new Map<Function, WeakMap<object, unknown>>();
const memo = <K extends {}, V>(key: K, producer: (key: K) => V): V => {
  let map = memoMap.get(producer);
  if (map === undefined) {
    memoMap.set(producer, (map = new WeakMap()));
  }
  let v = map.get(key);
  if (v === undefined) {
    v = producer(key);
  }
  return v as V;
};

function init(_modules: {
  typescript: typeof import('typescript/lib/tsserverlibrary');
}) {
  function create(info: ts.server.PluginCreateInfo) {
    const getChecker = (program: ts.Program) => program.getTypeChecker();
    const getCommandLine = (program: ts.Program) =>
      getCommandLineFromProgram(program, path);
    const context = {
      get program() {
        return info.languageService.getProgram()!;
      },
      get checker() {
        return memo(this.program, (program) => getChecker(program));
      },
      path,
      fs: ts.sys,
      get commandLine() {
        return memo(this.program, (program) => getCommandLine(program));
      },
      log: (s: string) => info.project.projectService.logger.info(s),
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
      const sourceFile = context.program.getSourceFileByPath(
        fileName.toLowerCase() as ts.Path
      );
      let result;
      if (sourceFile !== undefined) {
        result = getQuickInfoAtPosition(sourceFile, position, context);
      }
      return result ?? orig.getQuickInfoAtPosition(fileName, position);
    };

    service.getSemanticDiagnostics = (fileName: ts.Path) => {
      const diagnostics = orig.getSemanticDiagnostics(fileName);
      const sourceFile = context.program.getSourceFileByPath(
        fileName.toLowerCase() as ts.Path
      );
      if (sourceFile !== undefined) {
        console.log(
          sourceFile.text.slice(
            sourceFile.text.indexOf('/** @mixin'),
            sourceFile.text.indexOf(
              '};',
              sourceFile.text.indexOf('/** @mixin')
            ) + 3
          )
        );
        const module = getModule(sourceFile, context);
        diagnostics.push(...module.getDiagnostics());
      }
      context.log('*** Lit diagnostics:\n' + util.inspect(diagnostics));
      return diagnostics;
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
  context.log(`Looking for template model at ${position}`);
  const model = getTemplateModelAtPosition(sourceFile, position, context);
  if (model !== undefined) {
    context.log(`Found model at ${position}`);
    return {
      kind: ts.ScriptElementKind.label,
      textSpan: {
        start: model.start,
        length: model.end - model.start,
      },
      kindModifiers: '',
      displayParts: [
        {
          kind: 'text',
          text: `class ${model.el.name}`,
        },
      ],
      documentation: [
        {
          kind: 'text',
          text: `Custom element: &lt;${model.el.tagname}&gt;
          \n
          Heritage: ${getHeritage(model.el).join(' ← ')}`,
        },
      ],
    };
  }
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
      context.log((e as {})?.toString());
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
