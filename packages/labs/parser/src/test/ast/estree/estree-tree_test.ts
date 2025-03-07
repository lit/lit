/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import type {Expression} from 'oxc-parser';
import {isLitTaggedTemplateExpression} from '../../../lib/ast/estree/helpers.js';

suite('ESTree AST Structure', () => {
  suite('Serialized Tree Representation', () => {
    test('can serialize and compare Lit template expressions', () => {
      // Create a mock Lit tagged template expression
      const litTemplate = {
        type: 'TaggedTemplateExpression',
        start: 0,
        end: 25,
        tag: {
          type: 'Identifier',
          start: 0,
          end: 4,
          name: 'html',
        },
        quasi: {
          type: 'TemplateLiteral',
          start: 4,
          end: 25,
          expressions: [],
          quasis: [
            {
              type: 'TemplateElement',
              start: 5,
              end: 24,
              value: {
                raw: '<div>Hello world</div>',
                cooked: '<div>Hello world</div>',
              },
              tail: true,
            },
          ],
        },
        isLit: true,
      } as unknown as Expression;

      // Check that it's recognized as a Lit template
      assert.isTrue(isLitTaggedTemplateExpression(litTemplate));

      // Demonstrate serialization and comparison
      const serialized = JSON.stringify(
        litTemplate,
        (key, value) => {
          // Skip position info in serialization for readability
          if (key === 'start' || key === 'end') {
            return undefined;
          }
          return value;
        },
        2
      );

      const expectedSerialized = JSON.stringify(
        {
          type: 'TaggedTemplateExpression',
          tag: {
            type: 'Identifier',
            name: 'html',
          },
          quasi: {
            type: 'TemplateLiteral',
            expressions: [],
            quasis: [
              {
                type: 'TemplateElement',
                value: {
                  raw: '<div>Hello world</div>',
                  cooked: '<div>Hello world</div>',
                },
                tail: true,
              },
            ],
          },
          isLit: true,
        },
        null,
        2
      );

      assert.equal(serialized, expectedSerialized);
    });

    test('handles Lit template with expressions', () => {
      // Create a more complex template with expressions
      const complexTemplate = {
        type: 'TaggedTemplateExpression',
        start: 0,
        end: 35,
        tag: {
          type: 'Identifier',
          start: 0,
          end: 4,
          name: 'html',
        },
        quasi: {
          type: 'TemplateLiteral',
          start: 4,
          end: 35,
          expressions: [
            {
              type: 'Identifier',
              start: 14,
              end: 20,
              name: 'value',
            },
          ],
          quasis: [
            {
              type: 'TemplateElement',
              start: 5,
              end: 12,
              value: {
                raw: '<div>',
                cooked: '<div>',
              },
              tail: false,
            },
            {
              type: 'TemplateElement',
              start: 22,
              end: 34,
              value: {
                raw: '</div>',
                cooked: '</div>',
              },
              tail: true,
            },
          ],
        },
        isLit: true,
      } as unknown as Expression;

      // Check that it's recognized as a Lit template
      assert.isTrue(isLitTaggedTemplateExpression(complexTemplate));

      // Simplified serialization for comparison
      function serializeForCompare(node: any): any {
        return JSON.parse(
          JSON.stringify(node, (key, value) => {
            if (key === 'start' || key === 'end') {
              return undefined;
            }
            return value;
          })
        );
      }

      const serialized = serializeForCompare(complexTemplate);

      // Check the structural elements
      assert.equal(serialized.type, 'TaggedTemplateExpression');
      assert.equal(serialized.tag.name, 'html');
      assert.isTrue(serialized.isLit);

      // Check expressions
      assert.lengthOf(serialized.quasi.expressions, 1);
      assert.equal(serialized.quasi.expressions[0].type, 'Identifier');
      assert.equal(serialized.quasi.expressions[0].name, 'value');

      // Check quasis
      assert.lengthOf(serialized.quasi.quasis, 2);
      assert.equal(serialized.quasi.quasis[0].value.raw, '<div>');
      assert.equal(serialized.quasi.quasis[1].value.raw, '</div>');
    });
  });
});
