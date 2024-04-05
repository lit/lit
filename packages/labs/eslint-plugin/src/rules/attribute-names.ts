/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview Enforces attribute naming conventions
 */

import {ESLintUtils} from '@typescript-eslint/utils';
import ts from 'typescript';
import {
  createRule,
  getAnalyzer,
  getDeclarationForNode,
  isFalseLiteral,
  isTrueLiteral,
  isUndefinedLiteral,
} from '../lib/util.js';

export const attributeNames = createRule({
  name: 'attribute-names',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforces attribute naming conventions',
      recommended: 'recommended',
    },
    schema: [],
    messages: {
      casedAttribute:
        'Attributes are case-insensitive and therefore should be ' +
        'defined in lower case',
      casedPropertyWithoutAttribute:
        'Property has non-lowercase casing but no attribute. It should ' +
        'instead have an explicit `attribute` set to the lower case ' +
        'name (usually snake-case)',
    },
  },

  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const filename = context.filename;
    const analyzer = getAnalyzer(services);

    return {
      ClassDeclaration(node) {
        const tsNode = services.esTreeNodeToTSNodeMap.get(node);
        const declaration = getDeclarationForNode(analyzer, filename, tsNode);
        if (
          declaration === undefined ||
          !declaration.isLitElementDeclaration()
        ) {
          return;
        }
        const properties = declaration.reactiveProperties;

        for (const [propertyName, property] of properties.entries()) {
          const attributeOptionNode = property.optionsNode?.properties.find(
            (p): p is ts.PropertyAssignment =>
              ts.isPropertyAssignment(p) &&
              ts.isIdentifier(p.name) &&
              p.name.text === 'attribute'
          );

          // TODO (justinfagnani): handle other statically known truthy and
          // undefined values? This would let attribute names be in const
          // variables, etc., but still be lintable.
          if (
            attributeOptionNode === undefined ||
            isTrueLiteral(attributeOptionNode.initializer) ||
            isUndefinedLiteral(attributeOptionNode.initializer)
          ) {
            if (propertyName.toLowerCase() !== propertyName) {
              // Report on the whole property declaration, since there's no
              // attribute option
              const estreeNode = services.tsNodeToESTreeNodeMap.get(
                property.node
              );
              context.report({
                node: estreeNode,
                messageId: 'casedPropertyWithoutAttribute',
              });
            }
          } else if (isFalseLiteral(attributeOptionNode.initializer)) {
            continue;
          } else if (ts.isStringLiteral(attributeOptionNode.initializer)) {
            const attributeName = attributeOptionNode.initializer.text;
            if (attributeName.toLowerCase() !== attributeName) {
              // Report on just the attribute option
              const estreeNode =
                services.tsNodeToESTreeNodeMap.get(attributeOptionNode);
              context.report({
                node: estreeNode,
                messageId: 'casedAttribute',
              });
            }
          } else {
            // Unsupported attribute option.
            // TODO (justinfagnani): Report?
          }
        }
      },
    };
  },
  defaultOptions: [] as ReadonlyArray<unknown>,
});

// TODO (justinfagnani): Is this necessary?
export default attributeNames;
