/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {
  createDocumentFragment,
  DocumentFragment,
  CommentNode,
  TextNode,
  Element,
  LitHtmlExpression,
  LitTagLiteral,
  ParentNode,
  ChildNode,
} from '../../../lib/ast/html-parser/parse5-shim.js';
import {parseTemplateLiteral} from '../../../lib/ast/html-parser/template-literal.js';
import {parseTemplateLiteralSpan} from '../../../lib/ast/html-parser/template-literal-span.js';
import {
  Mode,
  State,
  AttributeMode,
} from '../../../lib/ast/html-parser/state.js';
import {
  With,
  LitLinkedExpression,
  TaggedTemplateExpression,
  TemplateExpression,
} from '../../../lib/ast/tree-adapter.js';
import {isElement} from '../../../lib/ast/print/helpers.js';
import {stringifyLiteralExpressionArray} from '../../../lib/ast/print/parse5/helpers.js';

/**
 * A comprehensive test harness for the HTML parser.
 *
 * This class provides utilities for testing all aspects of the HTML parser:
 * - Testing the parser's mode transitions
 * - Creating mock template expressions and testing their parsing
 * - Making assertions about the parsed AST
 */
export class HtmlParserTestHarness {
  /**
   * Creates a template expression for testing.
   *
   * @param content The raw content of the template
   * @returns A template expression object
   */
  createTemplateExpression(content: string): TemplateExpression {
    return {
      start: 0,
      end: content.length,
      value: {
        raw: content,
      },
    };
  }

  /**
   * Creates a mock TaggedTemplateExpression for testing.
   *
   * @param htmlContent The HTML content to include in the template
   * @param expressions Optional expressions to include in the template
   * @returns A mock TaggedTemplateExpression
   */
  createMockTemplate(
    htmlContent: string,
    expressions: Array<With<Object, LitLinkedExpression>> = []
  ): TaggedTemplateExpression {
    // Split the HTML content at expression placeholders
    const parts = htmlContent.split('${expr}');

    // Create spans for each part
    const spans: TemplateExpression[] = [];
    let currentPos = 5; // Start after 'html`'

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      spans.push({
        start: currentPos,
        end: currentPos + part.length,
        value: {
          raw: part,
        },
      });
      currentPos += part.length + 6; // 6 is the length of '${expr}'
    }

    // Create the mock template
    return {
      start: 0,
      end: currentPos + 1, // +1 for the closing backtick
      tagName: 'html',
      template: {
        start: 5,
        end: currentPos,
        spans: spans,
        expressions,
      },
      native: {
        isLit: false,
        documentFragment: undefined as unknown as DocumentFragment,
      },
    };
  }

  /**
   * Creates an initial parser state with the specified mode.
   *
   * @param mode The initial parser mode
   * @param attributeMode Optional attribute mode
   * @returns A new State object
   */
  createInitialState(
    mode: Mode = Mode.TEXT,
    attributeMode: AttributeMode | null = null
  ): State {
    const fragment = createDocumentFragment();
    return {
      mode,
      attributeMode,
      elementStack: [],
      document: fragment,
      endTagIgnore: false,
      charLocation: 0,
      checkingSecondDash: false,
      commentIsBogus: false,
      lastExpressionNode: null,
      potentialTextNode: null,
      currentAttributeQuote: null,
      currentAttributeNode: null,
      currentElementNode: null,
      currentTextNode: null,
      currentCommentNode: null,
      currentTagLiteral: null,
      currentEndTag: [],
    };
  }

  /**
   * Creates a mock expression for testing.
   *
   * @param value The value to include in the expression
   * @returns A mock expression object
   */
  createMockExpression(
    value: Record<string, unknown> = {}
  ): With<Record<string, unknown>, LitLinkedExpression> {
    return {
      ...value,
      litHtmlExpression: {
        type: 'LitHtmlExpression',
        value: 'expr',
      } as unknown as LitHtmlExpression,
    };
  }

  /**
   * Gets the current mode of the parser after parsing the given content.
   *
   * @param content The content to parse
   * @param initialMode Optional initial mode
   * @param initialAttributeMode Optional initial attribute mode
   * @returns The resulting parser mode
   */
  getParserMode(
    content: string,
    initialMode: Mode = Mode.TEXT,
    initialAttributeMode: AttributeMode | null = null
  ): Mode {
    const template = this.createTemplateExpression(content);
    const state = this.createInitialState(initialMode, initialAttributeMode);

    parseTemplateLiteralSpan(template, undefined, state);

    return state.mode;
  }

  /**
   * Gets the full parser state after parsing the given content.
   *
   * @param content The content to parse
   * @param initialMode Optional initial mode
   * @param initialAttributeMode Optional initial attribute mode
   * @returns The resulting parser state
   */
  getParserState(
    content: string,
    initialMode: Mode = Mode.TEXT,
    initialAttributeMode: AttributeMode | null = null
  ): State {
    const template = this.createTemplateExpression(content);
    const state = this.createInitialState(initialMode, initialAttributeMode);

    parseTemplateLiteralSpan(template, undefined, state);

    return state;
  }

  /**
   * Parses a template literal string into a DocumentFragment.
   *
   * @param htmlContent The HTML content to parse
   * @param expressions Optional expressions to include in the template
   * @returns The parsed DocumentFragment
   */
  parseHtml(
    htmlContent: string,
    expressions: Array<With<Object, LitLinkedExpression>> = []
  ): DocumentFragment {
    const template = this.createMockTemplate(htmlContent, expressions);
    return parseTemplateLiteral(template);
  }

  /**
   * Asserts that the parser is in the expected mode after parsing the content.
   *
   * @param content The content to parse
   * @param expectedMode The expected resulting mode
   * @param initialMode Optional initial mode
   * @param initialAttributeMode Optional initial attribute mode
   * @param message Optional assertion message
   */
  assertParserMode(
    content: string,
    expectedMode: Mode,
    initialMode: Mode = Mode.TEXT,
    initialAttributeMode: AttributeMode | null = null,
    message?: string
  ): void {
    const actualMode = this.getParserMode(
      content,
      initialMode,
      initialAttributeMode
    );
    assert.equal(
      actualMode,
      expectedMode,
      message ||
        `Expected parser mode to be ${Mode[expectedMode as keyof typeof Mode]} after parsing "${content}"`
    );
  }

  /**
   * Asserts that the parser is in the expected attribute mode after parsing the content.
   *
   * @param content The content to parse
   * @param expectedAttributeMode The expected resulting attribute mode
   * @param initialMode Optional initial mode
   * @param initialAttributeMode Optional initial attribute mode
   * @param message Optional assertion message
   */
  assertParserAttributeMode(
    content: string,
    expectedAttributeMode: AttributeMode | null,
    initialMode: Mode = Mode.TEXT,
    initialAttributeMode: AttributeMode | null = null,
    message?: string
  ): void {
    const state = this.getParserState(
      content,
      initialMode,
      initialAttributeMode
    );

    if (expectedAttributeMode === null) {
      assert.isNull(
        state.attributeMode,
        message ||
          `Expected attribute mode to be null after parsing "${content}"`
      );
    } else {
      assert.equal(
        state.attributeMode,
        expectedAttributeMode,
        message ||
          `Expected attribute mode to be ${AttributeMode[expectedAttributeMode as keyof typeof AttributeMode]} after parsing "${content}"`
      );
    }
  }

  /**
   * Tests a sequence of inputs to check mode transitions.
   *
   * @param inputs Array of input strings to process sequentially
   * @param expectedModes Array of expected modes after each input
   */
  testModeSequence(inputs: string[], expectedModes: Mode[]): void {
    assert.equal(
      inputs.length,
      expectedModes.length,
      'Inputs and expected modes arrays must have the same length'
    );

    const state = this.createInitialState();

    for (let i = 0; i < inputs.length; i++) {
      const template = this.createTemplateExpression(inputs[i]);
      parseTemplateLiteralSpan(template, undefined, state);

      assert.equal(
        state.mode,
        expectedModes[i],
        `Expected mode to be ${Mode[expectedModes[i] as keyof typeof Mode]} after input "${inputs[i]}"`
      );
    }
  }

  /**
   * Asserts that a node is a text node with the expected value.
   *
   * @param node The node to check
   * @param expectedValue The expected text value
   */
  assertTextNode(node: ChildNode, expectedValue: string): void {
    assert.equal(node.nodeName, '#text');
    assert.equal((node as TextNode).value, expectedValue);
  }

  /**
   * Asserts that a node is an element with the expected tag name.
   *
   * @param node The node to check
   * @param expectedTagName The expected tag name
   */
  assertElement(node: ChildNode, expectedTagName: string): void {
    assert(isElement(node), 'Node is not an element');
    const element = node;
    assert.equal(
      stringifyLiteralExpressionArray(element.tagName),
      expectedTagName
    );
  }

  /**
   * Asserts that a node is a comment with the expected data.
   *
   * @param node The node to check
   * @param expectedData The expected comment data
   */
  assertCommentNode(node: ChildNode, expectedData: string): void {
    assert.equal(node.nodeName, '#comment');
    // Comment data is stored as an array of LitTagLiteral and LitHtmlExpression
    const comment = node as CommentNode;
    const data = comment.data
      .filter((item): item is LitTagLiteral => item.type === 'LitTagLiteral')
      .map((item) => item.value)
      .join('');
    assert.equal(data, expectedData);
  }

  /**
   * Asserts that a node has the expected number of child nodes.
   *
   * @param node The node to check
   * @param expectedCount The expected number of child nodes
   */
  assertChildCount(node: ParentNode, expectedCount: number): void {
    assert.equal(node.childNodes.length, expectedCount);
  }

  /**
   * Asserts that an element has an attribute with the expected name and value.
   *
   * @param element The element to check
   * @param attrName The expected attribute name
   * @param expectedValue The expected attribute value
   */
  assertAttribute(
    element: Element,
    attrName: string,
    expectedValue: string
  ): void {
    const attr = element.attrs.find(
      (a) =>
        a.type !== 'LitHtmlExpression' &&
        a.name.some((n) => n.type === 'LitTagLiteral' && n.value === attrName)
    );
    assert.isDefined(attr, `Attribute ${attrName} not found`);
    if (attr && attr.type !== 'LitHtmlExpression') {
      const value = attr.value
        .filter((item): item is LitTagLiteral => item.type === 'LitTagLiteral')
        .map((item) => item.value)
        .join('');
      assert.equal(value, expectedValue);
    }
  }

  /**
   * Runs a test case for parsing HTML content.
   *
   * @param htmlContent The HTML content to parse
   * @param assertions A function that makes assertions on the parsed result
   * @param expressions Optional expressions to include in the template
   */
  testParse(
    htmlContent: string,
    assertions: (fragment: DocumentFragment) => void,
    expressions?: Array<With<Object, LitLinkedExpression>>
  ): void {
    // If expressions are not provided, create them automatically based on ${expr} placeholders
    if (!expressions) {
      const exprCount = (htmlContent.match(/\$\{expr\}/g) || []).length;
      expressions = Array(exprCount)
        .fill(0)
        .map(() => this.createMockExpression());
    }
    const fragment = this.parseHtml(htmlContent, expressions);
    assertions(fragment);
  }

  /**
   * Runs a test case for parsing a template span.
   *
   * @param template The template span to parse
   * @param initialState The initial parser state
   * @param assertions A function that makes assertions on the resulting state
   */
  testParseSpan(
    template: TemplateExpression,
    initialState: State,
    assertions: (state: State) => void
  ): void {
    const resultState = parseTemplateLiteralSpan(
      template,
      undefined,
      initialState
    );
    assertions(resultState);
  }
}
