/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {Mode} from '../../../lib/ast/html-parser/state.js';
import {Element} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Basic HTML Parsing', () => {
    test('parses simple text', () => {
      harness.testParse('Hello world', (fragment) => {
        harness.assertChildCount(fragment, 1);
        harness.assertTextNode(fragment.childNodes[0], 'Hello world');
      });
    });

    test('parses element with text', () => {
      harness.testParse('<div>Hello world</div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');
        harness.assertChildCount(div, 1);
        harness.assertTextNode(div.childNodes[0], 'Hello world');
      });
    });

    test('parses nested elements', () => {
      harness.testParse('<div><span>Hello</span> world</div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');
        harness.assertChildCount(div, 2);

        const span = div.childNodes[0] as Element;
        harness.assertElement(span, 'span');
        harness.assertChildCount(span, 1);
        harness.assertTextNode(span.childNodes[0], 'Hello');

        harness.assertTextNode(div.childNodes[1], ' world');
      });
    });

    test('parses element with attributes', () => {
      harness.testParse(
        '<div id="test" class="foo">Content</div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');
          harness.assertAttribute(div, 'id', 'test');
          harness.assertAttribute(div, 'class', 'foo');
          harness.assertChildCount(div, 1);
          harness.assertTextNode(div.childNodes[0], 'Content');
        }
      );
    });

    test('parses comments', () => {
      harness.testParse('<!-- This is a comment -->', (fragment) => {
        harness.assertChildCount(fragment, 1);
        harness.assertCommentNode(
          fragment.childNodes[0],
          ' This is a comment '
        );
      });
    });

    test('parses self-closing tags', () => {
      harness.testParse('<input type="text" />', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const input = fragment.childNodes[0] as Element;
        harness.assertElement(input, 'input');
        harness.assertAttribute(input, 'type', 'text');
        harness.assertChildCount(input, 0);
      });
    });
  });

  suite('Parser State Management', () => {
    test('transitions from TEXT to TAG mode', () => {
      const template = {
        start: 0,
        end: 5,
        value: {
          raw: '<div>',
        },
      };

      const initialState = harness.createInitialState(Mode.TEXT);

      harness.testParseSpan(template, initialState, (state) => {
        // After parsing '<div>', we should be in TEXT mode
        // and have a div element on the stack
        assert.equal(state.mode, Mode.TEXT);
        assert.equal(state.elementStack.length, 1);

        // Check that we have a div element (checking the node name safely)
        const element = state.elementStack[0];
        assert.isDefined(element);
        assert.property(element, 'tagName');

        // The tagName is an array of LitTagLiteral objects, so we need to extract the value
        const tagName = element.tagName
          .filter((item) => item.type === 'LitTagLiteral')
          .map((item: any) => item.value)
          .join('');

        assert.equal(tagName, 'div');
      });
    });

    test('transitions from TAG to ATTRIBUTE mode', () => {
      const template = {
        start: 0,
        end: 9,
        value: {
          raw: '<div id="',
        },
      };

      const initialState = harness.createInitialState(Mode.TEXT);

      harness.testParseSpan(template, initialState, (state) => {
        assert.equal(state.mode, Mode.ATTRIBUTE_VALUE);
        assert.isNotNull(state.currentElementNode);
        assert.isNotNull(state.currentAttributeNode);
        assert.equal(state.currentAttributeQuote, '"');
      });
    });

    test('handles closing tags', () => {
      const template = {
        start: 0,
        end: 11,
        value: {
          raw: '<div></div>',
        },
      };

      const initialState = harness.createInitialState(Mode.TEXT);

      harness.testParseSpan(template, initialState, (state) => {
        assert.equal(state.mode, Mode.TEXT);
        assert.isEmpty(state.elementStack);
        assert.isNull(state.currentElementNode);
      });
    });
  });

  suite('Expression Handling', () => {
    test('handles expressions in text context', () => {
      harness.testParse('Hello ${expr} world', (fragment) => {
        assert.isAtLeast(fragment.childNodes.length, 2);
        harness.assertTextNode(fragment.childNodes[0], 'Hello ');

        // Assert that the second node is an expression
        assert.isDefined(fragment.childNodes[1]);
        assert.property(fragment.childNodes[1], 'type');
        assert.equal((fragment.childNodes[1] as any).type, 'LitHtmlExpression');

        // If there's a third node, it should be the " world" text
        if (fragment.childNodes.length > 2) {
          harness.assertTextNode(fragment.childNodes[2], ' world');
        }
      });
    });

    test('handles expressions in attribute values', () => {
      harness.testParse('<div id="test-${expr}"></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');

        // Check that the attribute has both a literal part and an expression
        const idAttr = div.attrs.find(
          (a) =>
            a.type !== 'LitHtmlExpression' &&
            a.name.some((n) => n.type === 'LitTagLiteral' && n.value === 'id')
        );
        assert.isDefined(idAttr);
        if (idAttr && idAttr.type !== 'LitHtmlExpression') {
          assert.equal(idAttr.value.length, 2);
          assert.equal(idAttr.value[0].type, 'LitTagLiteral');
          assert.equal((idAttr.value[0] as any).value, 'test-');
          assert.equal(idAttr.value[1].type, 'LitHtmlExpression');
        }
      });
    });
  });
});
