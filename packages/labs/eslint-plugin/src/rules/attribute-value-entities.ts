/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview Disallows unencoded HTML entities in attribute values
 */

// import type {ESLintUtils} from '@typescript-eslint/utils';
import {TemplateAnalyzer} from '../template-analyzer.js';
import {createRule} from '../lib/util.js';

export const attributeValueEntities = createRule({
  name: 'attribute-value-entities',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallows unencoded HTML entities in attribute values',
      recommended: 'recommended',
    },
    schema: [],
    messages: {
      unencoded:
        'Attribute values may not contain unencoded HTML ' +
        'entities, e.g. use `&gt;` instead of `>`',
      doubleQuotes:
        'Attributes delimited by double quotes may not contain ' +
        'unencoded double quotes (e.g. `attr="bad"quote"`)',
      singleQuotes:
        'Attributes delimited by single quotes may not contain ' +
        "unencoded single quotes (e.g. `attr='bad'quote'`)",
    },
  },

  create(context) {
    const source = context.getSourceCode();
    const disallowedPattern = /([<>]|&(?!(#\d+|[a-z]+);))/;

    return {
      TaggedTemplateExpression(node) {
        if (
          node.type === 'TaggedTemplateExpression' &&
          node.tag.type === 'Identifier' &&
          node.tag.name === 'html'
        ) {
          const analyzer = TemplateAnalyzer.create(node);

          analyzer.traverse({
            enterElement(element) {
              // eslint-disable-next-line guard-for-in
              for (const attr in element.attribs) {
                const loc = analyzer.getLocationForAttribute(
                  element,
                  attr,
                  source
                );
                const rawValue = analyzer.getRawAttributeValue(element, attr);

                if (!loc || !rawValue?.value) {
                  continue;
                }

                if (disallowedPattern.test(rawValue.value)) {
                  context.report({
                    loc: loc,
                    messageId: 'unencoded',
                  });
                } else if (
                  rawValue.quotedValue?.startsWith('"') &&
                  rawValue.value?.includes('"')
                ) {
                  context.report({
                    loc: loc,
                    messageId: 'doubleQuotes',
                  });
                } else if (
                  rawValue.quotedValue?.startsWith("'") &&
                  rawValue.value?.includes("'")
                ) {
                  context.report({
                    loc: loc,
                    messageId: 'singleQuotes',
                  });
                }
              }
            },
          });
        }
      },
    };
  },
  defaultOptions: [] as ReadonlyArray<unknown>,
});

export default attributeValueEntities;
