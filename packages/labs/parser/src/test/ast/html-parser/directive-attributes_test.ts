/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {Mode, AttributeMode} from '../../../lib/ast/html-parser/state.js';
import {Element} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser Directive Attributes', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Property Binding', () => {
    test('parses property binding with .prop syntax', () => {
      harness.testParse('<div .myProp="value"></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'div');

        // Find the property attribute - note that the attribute name includes the '.' prefix
        const propAttr = element.attrs.find(
          (a) =>
            a.type === 'Property' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === '.myProp'
            )
        );

        assert.isDefined(propAttr, 'Property attribute should exist');
        if (propAttr && propAttr.type === 'Property') {
          // Check the attribute value
          const value = propAttr.value
            .filter((item) => item.type === 'LitTagLiteral')
            .map((item) => (item as any).value)
            .join('');

          assert.equal(value, 'value', 'Property value should be "value"');
        }
      });
    });

    test('parses property binding with expression', () => {
      harness.testParse('<div .myProp="${expr}"></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'div');

        // Find the property attribute - note that the attribute name includes the '.' prefix
        const propAttr = element.attrs.find(
          (a) =>
            a.type === 'Property' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === '.myProp'
            )
        );

        assert.isDefined(propAttr, 'Property attribute should exist');
        if (propAttr && propAttr.type === 'Property') {
          // Check that we have an expression in the value
          assert.equal(propAttr.value.length, 1, 'Should have one value part');
          assert.equal(
            propAttr.value[0].type,
            'LitHtmlExpression',
            'Value should be an expression'
          );
        }
      });
    });

    test('transitions to ATTRIBUTE mode with correct AttributeMode when encountering property binding', () => {
      const state = harness.getParserState('<div .myProp');

      assert.equal(state.mode, Mode.ATTRIBUTE);
      assert.equal(state.attributeMode, AttributeMode.PROPERTY);

      // Check that we're parsing the right attribute name
      assert.isNotNull(
        state.currentAttributeNode,
        'Current attribute node should exist'
      );
      if (state.currentAttributeNode) {
        const attributeName = state.currentAttributeNode.name
          .filter((n) => n.type === 'LitTagLiteral')
          .map((n) => (n as any).value)
          .join('');

        // The attribute name keeps the '.' prefix
        assert.equal(
          attributeName,
          '.myProp',
          'Attribute name should be ".myProp"'
        );
      }
    });
  });

  suite('Boolean Attributes', () => {
    test('parses boolean attribute with ?attr syntax', () => {
      harness.testParse('<input ?disabled="true"></input>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'input');

        // Find the boolean attribute - note that the attribute name includes the '?' prefix
        const boolAttr = element.attrs.find(
          (a) =>
            a.type === 'Boolean' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === '?disabled'
            )
        );

        assert.isDefined(boolAttr, 'Boolean attribute should exist');
        if (boolAttr && boolAttr.type === 'Boolean') {
          // Check the attribute value
          const value = boolAttr.value
            .filter((item) => item.type === 'LitTagLiteral')
            .map((item) => (item as any).value)
            .join('');

          assert.equal(value, 'true', 'Boolean value should be "true"');
        }
      });
    });

    test('parses boolean attribute with expression', () => {
      harness.testParse('<input ?disabled="${expr}"></input>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'input');

        // Find the boolean attribute - note that the attribute name includes the '?' prefix
        const boolAttr = element.attrs.find(
          (a) =>
            a.type === 'Boolean' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === '?disabled'
            )
        );

        assert.isDefined(boolAttr, 'Boolean attribute should exist');
        if (boolAttr && boolAttr.type === 'Boolean') {
          // Check that we have an expression in the value
          assert.equal(boolAttr.value.length, 1, 'Should have one value part');
          assert.equal(
            boolAttr.value[0].type,
            'LitHtmlExpression',
            'Value should be an expression'
          );
        }
      });
    });

    test('transitions to ATTRIBUTE mode with correct AttributeMode when encountering boolean attribute', () => {
      const state = harness.getParserState('<input ?disabled');

      assert.equal(state.mode, Mode.ATTRIBUTE);
      assert.equal(state.attributeMode, AttributeMode.BOOLEAN);

      // Check that we're parsing the right attribute name
      assert.isNotNull(
        state.currentAttributeNode,
        'Current attribute node should exist'
      );
      if (state.currentAttributeNode) {
        const attributeName = state.currentAttributeNode.name
          .filter((n) => n.type === 'LitTagLiteral')
          .map((n) => (n as any).value)
          .join('');

        // The attribute name keeps the '?' prefix
        assert.equal(
          attributeName,
          '?disabled',
          'Attribute name should be "?disabled"'
        );
      }
    });
  });

  suite('Event Binding', () => {
    test('parses event binding with @event syntax', () => {
      harness.testParse(
        '<button @click="handleClick"></button>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const element = fragment.childNodes[0] as Element;
          harness.assertElement(element, 'button');

          // Find the event attribute - note that the attribute name includes the '@' prefix
          const eventAttr = element.attrs.find(
            (a) =>
              a.type === 'Event' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === '@click'
              )
          );

          assert.isDefined(eventAttr, 'Event attribute should exist');
          if (eventAttr && eventAttr.type === 'Event') {
            // Check the attribute value
            const value = eventAttr.value
              .filter((item) => item.type === 'LitTagLiteral')
              .map((item) => (item as any).value)
              .join('');

            assert.equal(
              value,
              'handleClick',
              'Event handler should be "handleClick"'
            );
          }
        }
      );
    });

    test('parses event binding with expression', () => {
      harness.testParse('<button @click="${expr}"></button>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'button');

        // Find the event attribute - note that the attribute name includes the '@' prefix
        const eventAttr = element.attrs.find(
          (a) =>
            a.type === 'Event' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === '@click'
            )
        );

        assert.isDefined(eventAttr, 'Event attribute should exist');
        if (eventAttr && eventAttr.type === 'Event') {
          // Check that we have an expression in the value
          assert.equal(eventAttr.value.length, 1, 'Should have one value part');
          assert.equal(
            eventAttr.value[0].type,
            'LitHtmlExpression',
            'Value should be an expression'
          );
        }
      });
    });

    test('transitions to ATTRIBUTE mode with correct AttributeMode when encountering event binding', () => {
      const state = harness.getParserState('<button @click');

      assert.equal(state.mode, Mode.ATTRIBUTE);
      assert.equal(state.attributeMode, AttributeMode.EVENT);

      // Check that we're parsing the right attribute name
      assert.isNotNull(
        state.currentAttributeNode,
        'Current attribute node should exist'
      );
      if (state.currentAttributeNode) {
        const attributeName = state.currentAttributeNode.name
          .filter((n) => n.type === 'LitTagLiteral')
          .map((n) => (n as any).value)
          .join('');

        // The attribute name keeps the '@' prefix
        assert.equal(
          attributeName,
          '@click',
          'Attribute name should be "@click"'
        );
      }
    });
  });

  suite('Mixed Attribute Types', () => {
    test('parses property binding in isolation', () => {
      harness.testParse(`<div .prop="value"></div>`, (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'div');

        // Check for property binding
        const propAttr = element.attrs.find(
          (a) =>
            a.type === 'Property' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === '.prop'
            )
        );
        assert.isDefined(propAttr, 'Property attribute should exist');
      });
    });

    test('parses boolean attribute in isolation', () => {
      harness.testParse(`<div ?active="true"></div>`, (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'div');

        // Check for boolean attribute
        const boolAttr = element.attrs.find(
          (a) =>
            a.type === 'Boolean' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === '?active'
            )
        );
        assert.isDefined(boolAttr, 'Boolean attribute should exist');
      });
    });

    test('parses event binding in isolation', () => {
      harness.testParse(`<div @click="handler"></div>`, (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'div');

        // Check for event binding
        const eventAttr = element.attrs.find(
          (a) =>
            a.type === 'Event' &&
            a.name.some(
              (n) => n.type === 'LitTagLiteral' && n.value === '@click'
            )
        );
        assert.isDefined(eventAttr, 'Event attribute should exist');
      });
    });

    test('parses template with mixed attribute types', () => {
      harness.testParse(
        `<my-element
          id="regular-attr"
          .prop="value"
          ?active="true"
          @click="handler"
        ></my-element>`,
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const element = fragment.childNodes[0] as Element;
          harness.assertElement(element, 'my-element');

          // Check for regular string attribute
          harness.assertAttribute(element, 'id', 'regular-attr');

          // Check for property binding
          const propAttr = element.attrs.find(
            (a) =>
              a.type === 'Property' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === '.prop'
              )
          );
          assert.isDefined(propAttr, 'Property attribute should exist');

          // Check for boolean attribute
          const boolAttr = element.attrs.find(
            (a) =>
              a.type === 'Boolean' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === '?active'
              )
          );
          assert.isDefined(boolAttr, 'Boolean attribute should exist');

          // Check for event binding
          const eventAttr = element.attrs.find(
            (a) =>
              a.type === 'Event' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === '@click'
              )
          );
          assert.isDefined(eventAttr, 'Event attribute should exist');
        }
      );
    });
  });
});
