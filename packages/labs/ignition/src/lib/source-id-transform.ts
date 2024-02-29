/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type ts from 'typescript';
import {isLitTaggedTemplateExpression} from './parse-template.js';

type TypeScript = typeof ts;

const sourceIdAttribute = '__ignition-source-id__';

/**
 * Transforms lit-html templates in the TypeScript source to add
 * "source ID" attributes to each element.
 */
export const addSourceIds =
  (ts: TypeScript, checker: ts.TypeChecker) =>
  (context: ts.TransformationContext) =>
  (rootNode: ts.SourceFile) => {
    const factory = context.factory;

    let sourceId = 0;

    const transformTemplateText = (text: string) =>
      text.replace(
        /<([a-zA-Z0-9-]+)\s*/g,
        (_, tagName) => `<${tagName} ${sourceIdAttribute}="${sourceId++}"`
      );

    const visitor = (node: ts.Node): ts.Node => {
      if (isLitTaggedTemplateExpression(node, ts, checker)) {
        const {template, tag} = node;
        if (ts.isNoSubstitutionTemplateLiteral(template)) {
          const newTemplateText = transformTemplateText(template.text);
          const newTemplate =
            factory.createNoSubstitutionTemplateLiteral(newTemplateText);
          const newNode = factory.createTaggedTemplateExpression(
            tag,
            node.typeArguments,
            newTemplate
          );
          return newNode;
        } else if (ts.isTemplateExpression(template)) {
          const newHeadText = transformTemplateText(template.head.text);
          const newHead = factory.createTemplateHead(newHeadText);
          const newSpans = template.templateSpans.map(
            (span: ts.TemplateSpan) => {
              const spanText = span.literal.text;
              const newSpanText = transformTemplateText(spanText);
              if (ts.isTemplateMiddle(span.literal)) {
                return factory.createTemplateSpan(
                  ts.visitNode(span.expression, visitor) as ts.Expression,
                  factory.createTemplateMiddle(newSpanText)
                );
              } else {
                return factory.createTemplateSpan(
                  ts.visitNode(span.expression, visitor) as ts.Expression,
                  factory.createTemplateTail(newSpanText)
                );
              }
            }
          );
          const newTemplate = factory.createTemplateExpression(
            newHead,
            newSpans
          );
          const newNode = factory.createTaggedTemplateExpression(
            tag,
            node.typeArguments,
            newTemplate
          );
          return newNode;
        }
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitEachChild(rootNode, visitor, context);
  };
