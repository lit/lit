/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {Mode, AttributeMode} from '../../../lib/ast/html-parser/state.js';

suite('HTML Parser Mode Transitions', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Basic Mode Transitions', () => {
    test('starts in TEXT mode', () => {
      harness.assertParserMode('', Mode.TEXT);
    });

    test('transitions to TAG mode when encountering <', () => {
      harness.assertParserMode('<', Mode.TAG);
    });

    test('transitions to TAG_NAME mode after < and a character', () => {
      harness.assertParserMode('<d', Mode.TAG_NAME);
    });

    test('transitions to TAG mode after tag name and space', () => {
      harness.assertParserMode('<div ', Mode.TAG);
    });

    test('transitions to ATTRIBUTE_VALUE after attribute name and =', () => {
      harness.assertParserMode('<div class=', Mode.ATTRIBUTE_VALUE);
    });

    test('transitions to ATTRIBUTE_VALUE mode with double quotes', () => {
      harness.assertParserMode('<div class="', Mode.ATTRIBUTE_VALUE);
      harness.assertParserAttributeMode('<div class="', AttributeMode.STRING);
    });

    test('transitions to ATTRIBUTE_VALUE mode with single quotes', () => {
      harness.assertParserMode("<div class='", Mode.ATTRIBUTE_VALUE);
      harness.assertParserAttributeMode("<div class='", AttributeMode.STRING);
    });

    test('transitions to ATTRIBUTE_VALUE without quotes', () => {
      harness.assertParserMode('<div class=a', Mode.ATTRIBUTE_VALUE);
      harness.assertParserAttributeMode('<div class=a', AttributeMode.STRING);
    });

    test('transitions back to TAG after completing an unquoted attribute', () => {
      harness.assertParserMode('<div class=test ', Mode.TAG);
    });

    test('transitions back to TAG after completing a quoted attribute', () => {
      harness.assertParserMode('<div class="test" ', Mode.TAG);
    });

    test('transitions to TAG mode when encountering /', () => {
      harness.assertParserMode('<div/', Mode.TAG);
    });

    test('transitions to TEXT after self-closing tag', () => {
      harness.assertParserMode('<div/>', Mode.TEXT);
    });

    test('transitions to TEXT after closing a tag', () => {
      harness.assertParserMode('<div>', Mode.TEXT);
    });

    test('transitions to CLOSING_TAG when encountering </', () => {
      harness.assertParserMode('<div></d', Mode.CLOSING_TAG);
    });

    test('transitions to TEXT after complete end tag', () => {
      harness.assertParserMode('<div></div>', Mode.TEXT);
    });
  });

  suite('Comment Mode Transitions', () => {
    test('transitions to COMMENT mode when encountering <!-', () => {
      harness.assertParserMode('<!-', Mode.COMMENT);
    });

    test('transitions to COMMENT mode when encountering <!--', () => {
      harness.assertParserMode('<!--', Mode.COMMENT);
    });

    test('transitions to COMMENT mode when encountering - in comment', () => {
      harness.assertParserMode('<!---', Mode.COMMENT);
    });

    test('transitions to COMMENT mode when encountering -- in comment', () => {
      harness.assertParserMode('<!--a--', Mode.COMMENT);
    });

    test('transitions to TEXT after a complete comment', () => {
      harness.assertParserMode('<!--comment-->', Mode.TEXT);
    });
  });

  suite('Complex Mode Sequences', () => {
    test('sequence of opening tag, text, closing tag', () => {
      harness.testModeSequence(
        ['<div>', 'Hello world', '</div>'],
        [Mode.TEXT, Mode.TEXT, Mode.TEXT]
      );
    });

    test('sequence with multiple attributes', () => {
      harness.testModeSequence(
        ['<div ', 'class="foo" ', 'id="bar"', '>'],
        [Mode.TAG, Mode.TAG, Mode.TAG, Mode.TEXT]
      );
    });

    test('incomplete tag with attribute', () => {
      harness.assertParserMode('<div class=', Mode.ATTRIBUTE_VALUE);
    });

    test('incomplete template with opened attribute', () => {
      harness.assertParserMode('<div asdf=', Mode.ATTRIBUTE_VALUE);
    });
  });
});
