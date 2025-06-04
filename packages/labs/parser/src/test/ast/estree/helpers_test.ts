/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import type {Expression} from 'oxc-parser';
import {isLitTaggedTemplateExpression} from '../../../lib/ast/estree/helpers.js';

suite('ESTree Helpers', () => {
  suite('isLitTaggedTemplateExpression', () => {
    test('returns true for Lit tagged template expressions', () => {
      const node = {
        type: 'TaggedTemplateExpression',
        isLit: true,
        // Required properties for Expression
        start: 0,
        end: 10,
      } as unknown as Expression;

      assert.isTrue(isLitTaggedTemplateExpression(node));
    });

    test('returns false for non-Lit tagged template expressions', () => {
      const node = {
        type: 'TaggedTemplateExpression',
        isLit: false,
        // Required properties for Expression
        start: 0,
        end: 10,
      } as unknown as Expression;

      assert.isFalse(isLitTaggedTemplateExpression(node));
    });

    test('returns false for non-tagged template expressions', () => {
      const node = {
        type: 'TemplateLiteral',
        // Required properties for Expression
        start: 0,
        end: 10,
      } as unknown as Expression;

      assert.isFalse(isLitTaggedTemplateExpression(node));
    });

    test('returns false when isLit property is missing', () => {
      const node = {
        type: 'TaggedTemplateExpression',
        // Required properties for Expression
        start: 0,
        end: 10,
      } as unknown as Expression;

      assert.isFalse(isLitTaggedTemplateExpression(node));
    });
  });
});
