/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {Mode} from '../../../lib/ast/html-parser/state.js';
import {Element} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser Attribute Mode', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Attribute Mode Transitions', () => {
    test('transitions to TAG mode when encountering whitespace after tag name', () => {
      // Test for transition to TAG mode with space (not ATTRIBUTE as before)
      harness.assertParserMode('<div ', Mode.TAG);
    });

    test('transitions to ATTRIBUTE mode after attribute name', () => {
      // Create a mock HTML string that includes tag with attribute
      harness.assertParserMode('<div id', Mode.ATTRIBUTE);
    });

    test('transitions to ATTRIBUTE_VALUE mode after equals sign', () => {
      // Create a mock HTML string that includes tag with attribute and equals
      harness.assertParserMode('<div id=', Mode.ATTRIBUTE_VALUE);
    });

    test('transitions back to TAG mode after attribute value', () => {
      // Let's create a multi-step test that ensures we get back to TAG after a value
      harness.testModeSequence(
        ['<div ', 'id', '=', '"value"', ' '],
        [Mode.TAG, Mode.ATTRIBUTE, Mode.ATTRIBUTE_VALUE, Mode.TAG, Mode.TAG]
      );
    });
  });

  suite('Attribute Parsing', () => {
    test('parses attribute with double quotes', () => {
      harness.testParse('<div id="test"></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');
        harness.assertAttribute(div, 'id', 'test');
      });
    });

    test('parses attribute with single quotes', () => {
      harness.testParse("<div id='test'></div>", (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');
        harness.assertAttribute(div, 'id', 'test');
      });
    });

    test('parses attribute without quotes', () => {
      harness.testParse('<div id=test></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');
        harness.assertAttribute(div, 'id', 'test');
      });
    });

    test('parses attribute without value', () => {
      harness.testParse('<div disabled></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');

        // Check that the attribute exists but has an empty value
        const attr = div.attrs.find(
          (a) =>
            a.type === 'String' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === 'disabled'
            )
        );
        assert.isDefined(attr, 'Disabled attribute should exist');

        if (attr && attr.type === 'String') {
          const value = attr.value
            .filter((item) => item.type === 'LitTagLiteral')
            .map((item) => (item as any).value)
            .join('');

          assert.equal(value, '', 'Attribute should have empty value');
        }
      });
    });

    test('parses multiple attributes', () => {
      harness.testParse(
        '<div id="test" class="container" disabled></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          assert.equal(div.attrs.length, 3, 'Should have 3 attributes');
          harness.assertAttribute(div, 'id', 'test');
          harness.assertAttribute(div, 'class', 'container');

          // Check disabled attribute
          const disabledAttr = div.attrs.find(
            (a) =>
              a.type === 'String' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === 'disabled'
              )
          );
          assert.isDefined(disabledAttr, 'Disabled attribute should exist');
        }
      );
    });

    test('parses attribute with expression', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div id="${expr}"></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Find the id attribute
          const idAttr = div.attrs.find(
            (a) =>
              a.type === 'String' &&
              a.name.some((n) => n.type === 'LitTagLiteral' && n.value === 'id')
          );
          assert.isDefined(idAttr, 'id attribute should exist');

          if (idAttr && idAttr.type === 'String') {
            // Check that we have the expression in the value
            assert.equal(idAttr.value.length, 1, 'Should have one value part');
            assert.equal(
              idAttr.value[0].type,
              'LitHtmlExpression',
              'Value should be an expression'
            );
          }
        },
        [expr]
      );
    });

    test('parses attribute with mixed literal and expression', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div class="prefix-${expr}-suffix"></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Find the class attribute
          const classAttr = div.attrs.find(
            (a) =>
              a.type === 'String' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === 'class'
              )
          );
          assert.isDefined(classAttr, 'class attribute should exist');

          if (classAttr && classAttr.type === 'String') {
            // Should have three parts: prefix, expression, suffix
            assert.equal(
              classAttr.value.length,
              3,
              'Should have three value parts'
            );
            assert.equal(classAttr.value[0].type, 'LitTagLiteral');
            assert.equal(classAttr.value[1].type, 'LitHtmlExpression');
            assert.equal(classAttr.value[2].type, 'LitTagLiteral');

            // Check the prefix and suffix
            const prefix = (classAttr.value[0] as any).value;
            const suffix = (classAttr.value[2] as any).value;
            assert.equal(prefix, 'prefix-');
            assert.equal(suffix, '-suffix');
          }
        },
        [expr]
      );
    });
  });
});
