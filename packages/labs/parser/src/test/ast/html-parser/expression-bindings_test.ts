/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {
  Element,
  TextNode,
  LitStringAttribute,
  LitPropertyAttribute,
  LitBooleanAttribute,
  LitEventAttribute,
  LitTagLiteral,
} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser Expression Bindings', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Basic Expression Bindings', () => {
    test('binds expression at start of tag name', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<${expr}></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const element = fragment.childNodes[0] as Element;

          // Check that the tag name has an expression
          assert.equal(
            element.tagName.length,
            1,
            'Should have one tag name part'
          );
          assert.equal(
            element.tagName[0].type,
            'LitHtmlExpression',
            'Tag name should contain an expression'
          );
        },
        [expr]
      );
    });

    test('binds expression in text node', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div>${expr}</div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Check div has one child which is an expression
          harness.assertChildCount(div, 1);
          const child = div.childNodes[0];
          assert.equal(
            child.nodeName,
            '#lit-html-expression',
            'Child should be an expression'
          );
        },
        [expr]
      );
    });

    test('binds expression in attribute value', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div id="${expr}"></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Find id attribute
          const idAttr = div.attrs.find(
            (a) =>
              a.type === 'String' &&
              a.name.some((n) => n.type === 'LitTagLiteral' && n.value === 'id')
          ) as LitStringAttribute | undefined;
          assert.isDefined(idAttr, 'id attribute should exist');

          if (idAttr) {
            // Check value is an expression
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
  });

  suite('Special Attribute Bindings', () => {
    test('binds expression in property binding value', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div .myProp="${expr}"></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Find property attribute
          const propAttr = div.attrs.find((a) => a.type === 'Property') as
            | LitPropertyAttribute
            | undefined;
          assert.isDefined(propAttr, 'Property attribute should exist');

          if (propAttr) {
            // Check property binding value has expression
            assert.equal(
              propAttr.value.length,
              1,
              'Should have one value part'
            );
            assert.equal(
              propAttr.value[0].type,
              'LitHtmlExpression',
              'Value should be an expression'
            );

            // Check the property name
            assert.isArray(propAttr.name, 'Name should be an array');
            const nameParts = propAttr.name.filter(
              (p) => p.type === 'LitTagLiteral'
            ) as LitTagLiteral[];
            const nameStr = nameParts.map((p) => p.value).join('');
            assert.include(
              nameStr,
              '.myProp',
              'Property name should include .myProp'
            );
          }
        },
        [expr]
      );
    });

    test('binds expression in boolean attribute value', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div ?disabled="${expr}"></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Find boolean attribute
          const boolAttr = div.attrs.find((a) => a.type === 'Boolean') as
            | LitBooleanAttribute
            | undefined;
          assert.isDefined(boolAttr, 'Boolean attribute should exist');

          if (boolAttr) {
            // Check boolean attribute value has expression
            assert.equal(
              boolAttr.value.length,
              1,
              'Should have one value part'
            );
            assert.equal(
              boolAttr.value[0].type,
              'LitHtmlExpression',
              'Value should be an expression'
            );

            // Check the attribute name
            assert.isArray(boolAttr.name, 'Name should be an array');
            const nameParts = boolAttr.name.filter(
              (p) => p.type === 'LitTagLiteral'
            ) as LitTagLiteral[];
            const nameStr = nameParts.map((p) => p.value).join('');
            assert.include(
              nameStr,
              '?disabled',
              'Attribute name should include ?disabled'
            );
          }
        },
        [expr]
      );
    });

    test('binds expression in event binding value', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div @click="${expr}"></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Find event attribute
          const eventAttr = div.attrs.find((a) => a.type === 'Event') as
            | LitEventAttribute
            | undefined;
          assert.isDefined(eventAttr, 'Event attribute should exist');

          if (eventAttr) {
            // Check event attribute value has expression
            assert.equal(
              eventAttr.value.length,
              1,
              'Should have one value part'
            );
            assert.equal(
              eventAttr.value[0].type,
              'LitHtmlExpression',
              'Value should be an expression'
            );

            // Check the attribute name
            assert.isArray(eventAttr.name, 'Name should be an array');
            const nameParts = eventAttr.name.filter(
              (p) => p.type === 'LitTagLiteral'
            ) as LitTagLiteral[];
            const nameStr = nameParts.map((p) => p.value).join('');
            assert.include(
              nameStr,
              '@click',
              'Attribute name should include @click'
            );
          }
        },
        [expr]
      );
    });
  });

  suite('Attribute Value Bindings', () => {
    test('binds expression in middle of attribute value', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div class="prefix-${expr}-suffix"></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Find class attribute
          const classAttr = div.attrs.find(
            (a) =>
              a.type === 'String' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === 'class'
              )
          ) as LitStringAttribute | undefined;
          assert.isDefined(classAttr, 'class attribute should exist');

          if (classAttr) {
            // Check value has three parts (prefix, expression, suffix)
            assert.equal(
              classAttr.value.length,
              3,
              'Should have three value parts'
            );
            assert.equal(
              classAttr.value[0].type,
              'LitTagLiteral',
              'First part should be literal'
            );
            assert.equal(
              classAttr.value[1].type,
              'LitHtmlExpression',
              'Second part should be expression'
            );
            assert.equal(
              classAttr.value[2].type,
              'LitTagLiteral',
              'Third part should be literal'
            );

            // Check the literal parts
            const prefix = classAttr.value[0] as LitTagLiteral;
            const suffix = classAttr.value[2] as LitTagLiteral;
            assert.equal(prefix.value, 'prefix-', 'Prefix should match');
            assert.equal(suffix.value, '-suffix', 'Suffix should match');
          }
        },
        [expr]
      );
    });
  });

  suite('Text Node Bindings', () => {
    test('binds expression in middle of text node', () => {
      const expr = harness.createMockExpression();

      harness.testParse(
        '<div>Hello ${expr} world</div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Check div has text nodes and expression
          harness.assertChildCount(div, 3);

          // First child should be text
          const firstText = div.childNodes[0] as TextNode;
          assert.equal(
            firstText.nodeName,
            '#text',
            'First child should be text'
          );
          assert.equal(
            firstText.value,
            'Hello ',
            'First text content should match'
          );

          // Second child should be expression
          const expression = div.childNodes[1];
          assert.equal(
            expression.nodeName,
            '#lit-html-expression',
            'Second child should be expression'
          );

          // Third child should be text
          const lastText = div.childNodes[2] as TextNode;
          assert.equal(
            lastText.nodeName,
            '#text',
            'Third child should be text'
          );
          assert.equal(
            lastText.value,
            ' world',
            'Last text content should match'
          );
        },
        [expr]
      );
    });
  });
});
