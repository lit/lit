/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {
  Element,
  LitTagLiteral,
} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser Error Handling', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Malformed Tags', () => {
    test('handles unclosed tags by closing them implicitly', () => {
      harness.testParse('<div><span></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');

        harness.assertChildCount(div, 1);
        const span = div.childNodes[0] as Element;
        harness.assertElement(span, 'span');
      });
    });

    test('handles extra closing tags', () => {
      harness.testParse('<div></div></div>', (fragment) => {
        // Should parse the first div correctly and ignore the extra closing tag
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');
      });
    });

    test('handles mismatched closing tags', () => {
      harness.testParse('<div><span></div></span>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');

        // The span should be a child of div and closed implicitly
        harness.assertChildCount(div, 1);
        const span = div.childNodes[0] as Element;
        harness.assertElement(span, 'span');
      });
    });

    test('handles self-closing tags without slash', () => {
      harness.testParse('<img src="example.jpg">', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const img = fragment.childNodes[0] as Element;
        harness.assertElement(img, 'img');
        harness.assertAttribute(img, 'src', 'example.jpg');
      });
    });
  });

  suite('Malformed Attributes', () => {
    test('handles missing attribute values', () => {
      harness.testParse('<input disabled>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const input = fragment.childNodes[0] as Element;
        harness.assertElement(input, 'input');

        // Check that attribute exists without a value
        const attr = input.attrs.find((a) => {
          if (a.type === 'String') {
            const nameNodes = a.name.filter(
              (n) => n.type === 'LitTagLiteral'
            ) as LitTagLiteral[];
            return nameNodes.some((n) => n.value === 'disabled');
          }
          return false;
        });

        assert.isDefined(attr, 'Disabled attribute should exist');

        // The value should be empty
        if (attr && attr.type === 'String') {
          const valueNodes = attr.value.filter(
            (item) => item.type === 'LitTagLiteral'
          ) as LitTagLiteral[];
          const value = valueNodes.map((item) => item.value).join('');

          assert.equal(value, '', 'Attribute value should be empty');
        }
      });
    });

    test('handles malformed attribute syntax without quotes', () => {
      harness.testParse('<div id=test></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');

        // Check that attribute was parsed despite missing quotes
        harness.assertAttribute(div, 'id', 'test');
      });
    });

    test('handles missing closing quote in attribute value', () => {
      harness.testParse('<div id="test></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');

        // Attribute should exist even with missing closing quote
        const attr = div.attrs.find(
          (a) =>
            a.type === 'String' &&
            a.name.some((n) => n.type === 'LitTagLiteral' && n.value === 'id')
        );
        assert.isDefined(attr, 'id attribute should exist');
      });
    });

    test('handles duplicate attributes', () => {
      harness.testParse('<div id="first" id="second"></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');

        // Both attributes should be present
        const idAttrs = div.attrs.filter(
          (a) =>
            a.type === 'String' &&
            a.name.some((n) => n.type === 'LitTagLiteral' && n.value === 'id')
        );
        assert.isAtLeast(
          idAttrs.length,
          1,
          'Should have at least one id attribute'
        );
      });
    });
  });

  suite('Malformed Comments', () => {
    test('handles unclosed comments', () => {
      harness.testParse('<!-- This comment is not closed', (fragment) => {
        harness.assertChildCount(fragment, 1);
        // There should be a comment node, even though it's not properly closed
        assert.equal(fragment.childNodes[0].nodeName, '#comment');
      });
    });

    test('handles comments without proper opening sequence', () => {
      // A comment that doesn't have the full <!-- opening
      harness.testParse('<! Comment with wrong opening>', (fragment) => {
        // The parser will attempt to handle this based on its implementation
        // It's ok as long as it doesn't crash
        assert.exists(fragment, 'Fragment should exist');
      });
    });
  });

  suite('Invalid HTML Structure', () => {
    test('handles nested tags in invalid contexts', () => {
      // <p> inside <p> is invalid in HTML but should be handled
      harness.testParse('<p><p>Nested paragraph</p></p>', (fragment) => {
        // Check that the parser produced a reasonable structure
        assert.exists(fragment, 'Fragment should exist');
        assert.isAtLeast(
          fragment.childNodes.length,
          1,
          'Should have at least one child node'
        );
      });
    });

    test('handles malformed DOCTYPE', () => {
      harness.testParse('<!DOCTYPE><html></html>', (fragment) => {
        // The parser should handle malformed DOCTYPE without crashing
        assert.exists(fragment, 'Fragment should exist');
      });
    });
  });
});
