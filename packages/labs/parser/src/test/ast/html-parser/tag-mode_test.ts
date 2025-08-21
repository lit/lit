/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {Mode} from '../../../lib/ast/html-parser/state.js';
import {Element} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser Tag Mode', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Tag Mode Transitions', () => {
    test('transitions to TAG mode when encountering opening angle bracket', () => {
      const state = harness.getParserState('<');
      assert.equal(state.mode, Mode.TAG);
    });

    test('remains in TAG_NAME mode when encountering tag name', () => {
      const state = harness.getParserState('<div');
      assert.equal(state.mode, Mode.TAG_NAME);
    });

    test('transitions from TAG to TEXT mode when encountering closing angle bracket', () => {
      const state = harness.getParserState('<div>');
      assert.equal(state.mode, Mode.TEXT);
    });

    test('transitions to CLOSING_TAG mode when encountering closing tag', () => {
      const state = harness.getParserState('</');
      assert.equal(state.mode, Mode.CLOSING_TAG);
    });

    test('transitions from CLOSING_TAG to TEXT mode when encountering closing angle bracket', () => {
      const state = harness.getParserState('</div>');
      assert.equal(state.mode, Mode.TEXT);
    });
  });

  suite('Tag Parsing', () => {
    test('parses simple tag', () => {
      harness.testParse('<div></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'div');
      });
    });

    test('parses nested tags', () => {
      harness.testParse('<div><span></span></div>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const div = fragment.childNodes[0] as Element;
        harness.assertElement(div, 'div');
        harness.assertChildCount(div, 1);

        const span = div.childNodes[0] as Element;
        harness.assertElement(span, 'span');
      });
    });

    test('parses self-closing tags', () => {
      harness.testParse('<img src="example.jpg" />', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const img = fragment.childNodes[0] as Element;
        harness.assertElement(img, 'img');
        harness.assertAttribute(img, 'src', 'example.jpg');
      });
    });

    test('parses tags with attributes', () => {
      harness.testParse(
        '<div id="main" class="container"></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          harness.assertAttribute(div, 'id', 'main');
          harness.assertAttribute(div, 'class', 'container');
        }
      );
    });
  });

  suite('SVG Tags', () => {
    test('parses SVG elements', () => {
      harness.testParse(
        '<svg width="100" height="100"><circle cx="50" cy="50" r="40"></circle></svg>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const svg = fragment.childNodes[0] as Element;
          harness.assertElement(svg, 'svg');

          harness.assertAttribute(svg, 'width', '100');
          harness.assertAttribute(svg, 'height', '100');

          harness.assertChildCount(svg, 1);
          const circle = svg.childNodes[0] as Element;
          harness.assertElement(circle, 'circle');

          harness.assertAttribute(circle, 'cx', '50');
          harness.assertAttribute(circle, 'cy', '50');
          harness.assertAttribute(circle, 'r', '40');
        }
      );
    });
  });

  suite('Custom Elements', () => {
    test('parses custom element with hyphen in name', () => {
      harness.testParse('<custom-element></custom-element>', (fragment) => {
        harness.assertChildCount(fragment, 1);
        const element = fragment.childNodes[0] as Element;
        harness.assertElement(element, 'custom-element');
      });
    });

    test('parses nested custom elements', () => {
      harness.testParse(
        '<my-container><my-item></my-item></my-container>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const container = fragment.childNodes[0] as Element;
          harness.assertElement(container, 'my-container');

          harness.assertChildCount(container, 1);
          const item = container.childNodes[0] as Element;
          harness.assertElement(item, 'my-item');
        }
      );
    });

    test('parses custom element with multiple hyphens in name', () => {
      harness.testParse(
        '<my-custom-element></my-custom-element>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const element = fragment.childNodes[0] as Element;
          harness.assertElement(element, 'my-custom-element');
        }
      );
    });

    test('parses custom elements with attributes', () => {
      harness.testParse(
        '<my-button primary size="large"></my-button>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const element = fragment.childNodes[0] as Element;
          harness.assertElement(element, 'my-button');

          // Check for attributes
          assert.equal(element.attrs.length, 2, 'Should have 2 attributes');

          // Check primary attribute (valueless)
          const primaryAttr = element.attrs.find(
            (a) =>
              a.type === 'String' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === 'primary'
              )
          );
          assert.isDefined(primaryAttr, 'Primary attribute should exist');

          // Check size attribute
          harness.assertAttribute(element, 'size', 'large');
        }
      );
    });
  });
});
