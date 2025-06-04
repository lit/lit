/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {Mode} from '../../../lib/ast/html-parser/state.js';
import {Element, TextNode} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser Text Mode', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Text Mode Transitions', () => {
    test('starts in TEXT mode by default', () => {
      const state = harness.getParserState('');
      assert.equal(state.mode, Mode.TEXT);
    });

    test('stays in TEXT mode when encountering plain text', () => {
      const state = harness.getParserState('Hello world');
      assert.equal(state.mode, Mode.TEXT);
    });

    test('transitions from TEXT mode to TAG mode when encountering opening angle bracket', () => {
      // Process text content then opening bracket
      harness.assertParserMode('Text content<', Mode.TAG);
    });
  });

  suite('Text Parsing', () => {
    test('parses plain text', () => {
      harness.testParse('Hello world', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const textNode = fragment.childNodes[0] as TextNode;
        assert.equal(textNode.nodeName, '#text');
        assert.isDefined(textNode.value);
        assert.equal(textNode.value, 'Hello world');
      });
    });

    test('parses text with special characters', () => {
      harness.testParse('Text with symbols: !@#$%^&*()_+', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const textNode = fragment.childNodes[0] as TextNode;
        assert.equal(textNode.nodeName, '#text');
        assert.equal(textNode.value, 'Text with symbols: !@#$%^&*()_+');
      });
    });

    test('parses text inside elements', () => {
      harness.testParse('<div>Text content</div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');

        harness.assertChildCount(div, 1);
        const textNode = div.childNodes[0] as TextNode;
        assert.equal(textNode.nodeName, '#text');
        assert.equal(textNode.value, 'Text content');
      });
    });

    test('parses text with expressions', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        'Text ${expr} content',
        (fragment) => {
          // Should have text + expression + text
          assert.equal(fragment.childNodes.length, 3);
          assert.equal((fragment.childNodes[0] as TextNode).value, 'Text ');
          assert.equal(fragment.childNodes[1].nodeName, '#lit-html-expression');
          assert.equal((fragment.childNodes[2] as TextNode).value, ' content');
        },
        [expr]
      );
    });

    test('preserves whitespace in text content', () => {
      harness.testParse('  Text with  spaces  ', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const textNode = fragment.childNodes[0] as TextNode;
        assert.equal(textNode.value, '  Text with  spaces  ');
      });
    });

    test('parses mixed text, tags, and expressions', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div>Text <span>${expr}</span> More text</div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Div should have 3 children: Text, Span, and More text
          harness.assertChildCount(div, 3);

          assert.equal((div.childNodes[0] as TextNode).value, 'Text ');

          const span = div.childNodes[1] as Element;
          harness.assertElement(span, 'span');
          assert.equal(span.childNodes[0].nodeName, '#lit-html-expression');

          assert.equal((div.childNodes[2] as TextNode).value, ' More text');
        },
        [expr]
      );
    });
  });
});
