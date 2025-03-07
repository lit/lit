/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {parseTemplateLiteral} from '../../../lib/ast/html-parser/template-literal.js';
import {TaggedTemplateExpression} from '../../../lib/ast/tree-adapter.js';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';

suite('template-literal', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  test('parseTemplateLiteral creates a document fragment', () => {
    // Create a mock TaggedTemplateExpression
    const mockTemplate: TaggedTemplateExpression = {
      start: 0,
      end: 20,
      tagName: 'html',
      template: {
        start: 5,
        end: 19,
        spans: [
          {
            start: 6,
            end: 18,
            value: {
              raw: '<div>Hello</div>',
            },
          },
        ],
        expressions: [],
      },
      native: {
        isLit: false,
        documentFragment: undefined as any,
      },
    };

    const fragment = parseTemplateLiteral(mockTemplate);

    // Verify the fragment was created
    assert.isDefined(fragment);
    assert.equal(fragment.childNodes.length, 1);

    // Verify the source location was set correctly
    assert.deepEqual(fragment.sourceCodeLocation, {
      startOffset: 6,
      endOffset: 18,
    });

    // Verify the template was updated with a reference to the fragment
    assert.equal(mockTemplate.native.documentFragment, fragment);
    assert.isTrue(mockTemplate.native.isLit);
  });

  test('parseTemplateLiteral handles empty template', () => {
    // Create a mock TaggedTemplateExpression with empty content
    const mockTemplate: TaggedTemplateExpression = {
      start: 0,
      end: 10,
      tagName: 'html',
      template: {
        start: 5,
        end: 9,
        spans: [
          {
            start: 6,
            end: 8,
            value: {
              raw: '',
            },
          },
        ],
        expressions: [],
      },
      native: {
        isLit: false,
        documentFragment: undefined as any,
      },
    };

    const fragment = parseTemplateLiteral(mockTemplate);

    // Verify the fragment was created
    assert.isDefined(fragment);
    assert.equal(fragment.childNodes.length, 0);

    // Verify the source location was set correctly
    assert.deepEqual(fragment.sourceCodeLocation, {
      startOffset: 6,
      endOffset: 8,
    });
  });

  test('parseTemplateLiteral handles template with expressions', () => {
    // Create a mock expression
    const mockExpression = {
      litHtmlExpression: null as any,
    };

    // Create a mock TaggedTemplateExpression with an expression
    const mockTemplate: TaggedTemplateExpression = {
      start: 0,
      end: 20,
      tagName: 'html',
      template: {
        start: 5,
        end: 19,
        spans: [
          {
            start: 6,
            end: 10,
            value: {
              raw: '<div>',
            },
          },
          {
            start: 15,
            end: 18,
            value: {
              raw: '</div>',
            },
          },
        ],
        expressions: [mockExpression],
      },
      native: {
        isLit: false,
        documentFragment: undefined as any,
      },
    };

    const fragment = parseTemplateLiteral(mockTemplate);

    // Verify the fragment was created
    assert.isDefined(fragment);

    // Use the harness for assertions
    harness.assertChildCount(fragment, 1);

    const divElement = fragment.childNodes[0];
    harness.assertElement(divElement, 'div');

    // Verify the source location was set correctly
    assert.deepEqual(fragment.sourceCodeLocation, {
      startOffset: 6,
      endOffset: 18,
    });

    // Verify that the template now has a reference to the parsed fragment
    assert.strictEqual(mockTemplate.native.documentFragment, fragment);
    assert.isTrue(mockTemplate.native.isLit);
  });
});
