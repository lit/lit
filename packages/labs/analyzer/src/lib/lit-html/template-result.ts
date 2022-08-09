/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with events
 */

import ts from 'typescript';
import {AnalyzerContext, LitElementDeclaration} from '../model.js';
import {
  isElement,
  Node,
  ParsedTemplateResult as IParsedTemplateResult,
  parseTemplateResult,
  TemplateResult,
  traverse,
} from '@lit-labs/template-parser/index.js';
import {getModule} from '../javascript/modules.js';

const tagTypes = {
  html: 1,
  svg: 2,
};

interface ParsedTemplateResult extends IParsedTemplateResult {
  offset: number;
}

export const getParsedTemplateResultAtPosition = (
  sourceFile: ts.SourceFile,
  pos: number
): ParsedTemplateResult | undefined => {
  const visit = (node: ts.Node): ParsedTemplateResult | undefined => {
    if (
      ts.isTaggedTemplateExpression(node) &&
      pos >= node.getStart() &&
      pos <= node.getEnd()
    ) {
      const {tag} = node;
      if (ts.isIdentifier(tag)) {
        const type = tagTypes[tag.text as keyof typeof tagTypes];
        if (ts.isIdentifier(tag) && type !== undefined) {
          return {
            ...parseTemplateResult(
              templateResultFromTaggedTemplateExpression(type, node)
            ),
            offset: node.getStart(),
          };
        }
      }
    }
    return ts.forEachChild(node, visit);
  };
  return sourceFile.forEachChild(visit);
};

const templateResultFromTaggedTemplateExpression = (
  type: number,
  expr: ts.TaggedTemplateExpression
): TemplateResult => {
  const template = expr.template;
  const strings = ts.isNoSubstitutionTemplateLiteral(template)
    ? [template.text]
    : [
        template.head.text,
        ...template.templateSpans.map((s) => s.literal.text),
      ];
  const values = ts.isNoSubstitutionTemplateLiteral(template)
    ? []
    : template.templateSpans.map((s) => s.expression);
  return {
    _$litType$: type,
    strings: toTemplateStringsArray(strings),
    values: values,
  } as unknown as TemplateResult;
};

const toTemplateStringsArray = (strings: string[]) => {
  (strings as unknown as {raw: string[]}).raw = strings;
  return strings;
};

export interface TemplateModel {
  el: LitElementDeclaration;
  start: number;
  end: number;
}

export const getTemplateModelAtPosition = (
  sourceFile: ts.SourceFile,
  pos: number,
  context: AnalyzerContext
): TemplateModel | undefined => {
  const templateResult = getParsedTemplateResultAtPosition(sourceFile, pos);
  let model: TemplateModel | undefined = undefined;
  if (templateResult !== undefined) {
    const offset = pos - templateResult.offset;
    traverse(templateResult.ast, {
      pre(node: Node) {
        if (node.sourceCodeLocation === undefined) {
          return true;
        }
        const {startOffset, endOffset} = node.sourceCodeLocation!;
        if (
          isElement(node) &&
          node.tagName.includes('-') &&
          offset >= startOffset &&
          offset <= endOffset
        ) {
          const {tagName} = node;
          model = {
            el: getModule(sourceFile, context).getCustomElementDeclaration(
              tagName
            )!,
            start: offset + startOffset,
            end: offset + endOffset,
          };
          return false;
        }
        return true;
      },
    });
  }
  return model;
};
