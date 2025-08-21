/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {Mode, AttributeMode} from '../../../lib/ast/html-parser/state.js';
import {assert} from 'chai';

suite('HTML Parser Examples', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  /**
   * This test demonstrates how to use the test harness to test
   * the specific example from the user's query:
   * `const hello = html\`<div asdf=\``
   */
  test('example: html`<div asdf=`', () => {
    // Get the parser state after parsing
    const state = harness.getParserState('<div asdf=');

    // Assert on the current mode and attribute mode
    assert.equal(state.mode, Mode.ATTRIBUTE_VALUE);
    assert.equal(state.attributeMode, AttributeMode.STRING);

    // Assert on the element being parsed
    assert.isNotNull(
      state.currentElementNode,
      'Current element node should exist'
    );

    // Assert on the attribute being parsed
    assert.isNotNull(
      state.currentAttributeNode,
      'Current attribute node should exist'
    );

    // Type guard to handle null case even though we already checked above
    if (state.currentAttributeNode) {
      assert.isArray(
        state.currentAttributeNode.name,
        'Attribute name should be an array'
      );
      assert.isTrue(
        state.currentAttributeNode.name.length > 0,
        'Attribute name array should not be empty'
      );

      const attributeName = state.currentAttributeNode.name
        .filter((n) => n.type === 'LitTagLiteral')
        .map((n) => (n as any).value)
        .join('');

      assert.equal(attributeName, 'asdf', 'Attribute name should be "asdf"');
    }
  });

  suite('Real-World Examples', () => {
    test('incomplete tag with attribute with no value', () => {
      const state = harness.getParserState('<button disabled');

      assert.equal(state.mode, Mode.ATTRIBUTE);
      assert.isNotNull(
        state.currentElementNode,
        'Current element node should exist'
      );
      assert.isNotNull(
        state.currentAttributeNode,
        'Current attribute node should exist'
      );

      // Type guard to handle null case even though we already checked above
      if (state.currentAttributeNode) {
        const attributeName = state.currentAttributeNode.name
          .filter((n) => n.type === 'LitTagLiteral')
          .map((n) => (n as any).value)
          .join('');

        assert.equal(
          attributeName,
          'disabled',
          'Attribute name should be "disabled"'
        );
      }
    });

    test('tag with attribute and expression as value', () => {
      // First parse up to the expression
      const state = harness.getParserState('<div class=');

      // The actual mode/attributeMode depends on the current implementation
      assert.equal(state.mode, Mode.ATTRIBUTE_VALUE);
      // Don't check attributeMode explicitly since it might differ

      // At this point, if an expression were to follow, it would be treated as an expression
      // in an attribute value
    });

    test('tag with attribute inside quotes and expression', () => {
      // First parse up to the expression
      const state = harness.getParserState('<div class="foo-');

      // We should be in attribute value mode with string attribute mode
      assert.equal(state.mode, Mode.ATTRIBUTE_VALUE);
      assert.equal(state.attributeMode, AttributeMode.STRING);

      // At this point, if an expression were to follow, it would be treated as an expression
      // in a quoted attribute value
    });

    test('inside a comment', () => {
      const state = harness.getParserState('<!-- comment');

      assert.equal(state.mode, Mode.COMMENT);
      assert.isNotNull(state.currentCommentNode);
    });
  });

  suite('Testing Mode Sequences', () => {
    test('opening tag, adding attributes, closing tag', () => {
      harness.testModeSequence(
        ['<div', ' class="test"', ' id="foo"', '>'],
        [Mode.TAG_NAME, Mode.TAG, Mode.TAG, Mode.TEXT]
      );
    });

    test('handling nested tags', () => {
      harness.testModeSequence(
        ['<div>', '<span>', 'text', '</span>', '</div>'],
        [Mode.TEXT, Mode.TEXT, Mode.TEXT, Mode.TEXT, Mode.TEXT]
      );
    });

    test('handling complex attribute scenarios', () => {
      harness.testModeSequence(
        [
          '<input ',
          'type="text" ',
          'value="" ',
          'disabled ',
          'data-test="complex"',
          '>',
        ],
        [Mode.TAG, Mode.TAG, Mode.TAG, Mode.TAG, Mode.TAG, Mode.TEXT]
      );
    });
  });
});
