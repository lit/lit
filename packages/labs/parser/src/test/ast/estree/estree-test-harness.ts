/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import type {Expression, Statement, Directive} from 'oxc-parser';
import {isLitTaggedTemplateExpression} from '../../../lib/ast/estree/helpers.js';
import type {
  LitTaggedTemplateExpression,
  With,
} from '../../../lib/ast/tree-adapter.js';

/**
 * A test harness for the ESTree AST tests.
 *
 * This class provides utilities for testing the ESTree-related AST functionality,
 * including creating mock nodes and asserting on their properties.
 */
export class EsTreeTestHarness {
  /**
   * Creates a mock tagged template expression for testing.
   *
   * @param tag The tag name (e.g., 'html', 'css', 'js')
   * @param templateContent The template content
   * @param isLit Whether this is a Lit tagged template
   * @returns A mock tagged template expression
   */
  createMockTaggedTemplateExpression(
    tag: string,
    templateContent: string,
    isLit: boolean = true
  ): Expression {
    // Create a simple tagged template expression with required properties
    const expr = {
      type: 'TaggedTemplateExpression',
      span: {
        start: 0,
        end: templateContent.length + tag.length + 2, // +2 for the backticks
        ctxt: 0,
      },
      tag: {
        type: 'Identifier',
        span: {
          start: 0,
          end: tag.length,
          ctxt: 0,
        },
        value: tag,
        optional: false,
      },
      typeParameters: null,
      template: {
        type: 'TemplateLiteral',
        span: {
          start: tag.length,
          end: tag.length + templateContent.length + 2,
          ctxt: 0,
        },
        expressions: [],
        quasis: [
          {
            type: 'TemplateElement',
            span: {
              start: tag.length + 1,
              end: tag.length + templateContent.length + 1,
              ctxt: 0,
            },
            tail: true,
            cooked: templateContent,
            raw: templateContent,
          },
        ],
      },
      // Add required properties for Expression
      start: 0,
      end: templateContent.length + tag.length + 2,
      // Add the isLit property
      isLit,
    };

    return expr as unknown as Expression;
  }

  /**
   * Asserts that a node is a Lit tagged template expression.
   *
   * @param node The node to check
   * @param message Optional assertion message
   */
  assertIsLitTaggedTemplateExpression<
    T extends Directive | Statement | Expression,
  >(
    node: T,
    message: string = 'Node is not a Lit tagged template expression'
  ): asserts node is With<T, LitTaggedTemplateExpression> {
    assert.isTrue(isLitTaggedTemplateExpression(node), message);
  }

  /**
   * Asserts that a node is not a Lit tagged template expression.
   *
   * @param node The node to check
   * @param message Optional assertion message
   */
  assertNotLitTaggedTemplateExpression<
    T extends Directive | Statement | Expression,
  >(
    node: T,
    message: string = 'Node should not be a Lit tagged template expression'
  ): void {
    assert.isFalse(isLitTaggedTemplateExpression(node), message);
  }

  /**
   * Asserts that a Lit tagged template expression has the expected tag name.
   *
   * @param node The tagged template expression to check
   * @param expectedTag The expected tag name
   */
  assertTagName(
    node: Expression & {tag?: {type?: string; value?: string}},
    expectedTag: string
  ): void {
    assert.isDefined(node.tag, 'Node has no tag property');
    assert.isDefined(node.tag?.type, 'Node tag has no type property');
    assert.equal(node.tag?.type, 'Identifier');
    assert.equal(node.tag?.value, expectedTag);
  }

  /**
   * Serializes an AST node into a human-readable format for testing.
   *
   * @param node The node to serialize
   * @returns A human-readable representation of the node
   */
  serializeNode(node: unknown): string {
    // Simple serialization for testing
    return JSON.stringify(
      node,
      (key, value) => {
        // Skip span information to make output more readable
        if (key === 'span') {
          return undefined;
        }
        return value;
      },
      2
    );
  }

  /**
   * Compares a node against an expected serialized representation.
   *
   * @param node The node to check
   * @param expectedSerialized The expected serialized representation
   */
  assertNodeMatchesSerialized(node: unknown, expectedSerialized: string): void {
    const serialized = this.serializeNode(node);
    assert.equal(serialized, expectedSerialized);
  }
}
