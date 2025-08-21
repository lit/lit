/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {HtmlParserTestHarness} from './html-parser-test-harness.js';
import {
  Element,
  LitHtmlExpression,
} from '../../../lib/ast/html-parser/parse5-shim.js';

suite('HTML Parser TypeScript AST Integration', () => {
  let harness: HtmlParserTestHarness;

  setup(() => {
    harness = new HtmlParserTestHarness();
  });

  suite('Expression Linking', () => {
    test('links expression nodes to source expressions', () => {
      // Create a mock expression with some TypeScript AST-like properties
      const tsExpr = harness.createMockExpression({
        kind: 'Identifier',
        name: 'myVariable',
        type: 'string',
      });

      harness.testParse(
        '<div>${expr}</div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Find the expression node
          harness.assertChildCount(div, 1);
          const exprNode = div.childNodes[0] as LitHtmlExpression;
          assert.equal(exprNode.nodeName, '#lit-html-expression');

          // Check that it's linked to our original expression
          assert.isDefined(
            exprNode.value,
            'Expression value should be defined'
          );
          assert.isDefined(
            (exprNode.value as any).litHtmlExpression,
            'Expression should be linked'
          );

          // Check that TypeScript AST properties are preserved
          assert.equal((exprNode.value as any).kind, 'Identifier');
          assert.equal((exprNode.value as any).name, 'myVariable');
          assert.equal((exprNode.value as any).type, 'string');
        },
        [tsExpr]
      );
    });

    test('links expression nodes in attribute values', () => {
      // Create a mock expression with some TypeScript AST-like properties
      const tsExpr = harness.createMockExpression({
        kind: 'BinaryExpression',
        operator: '+',
        left: {kind: 'StringLiteral', value: 'prefix-'},
        right: {kind: 'Identifier', name: 'className'},
      });

      harness.testParse(
        '<div class="${expr}"></div>',
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
            // Get the expression
            assert.equal(
              classAttr.value.length,
              1,
              'Should have one value part'
            );
            assert.equal(classAttr.value[0].type, 'LitHtmlExpression');

            const exprNode = classAttr.value[0] as LitHtmlExpression;

            // Check that it's linked to our original expression
            assert.isDefined(
              exprNode.value,
              'Expression value should be defined'
            );
            assert.isDefined(
              (exprNode.value as any).litHtmlExpression,
              'Expression should be linked'
            );

            // Check that TypeScript AST properties are preserved
            assert.equal((exprNode.value as any).kind, 'BinaryExpression');
            assert.equal((exprNode.value as any).operator, '+');
            assert.isDefined(
              (exprNode.value as any).left,
              'Left operand should exist'
            );
            assert.isDefined(
              (exprNode.value as any).right,
              'Right operand should exist'
            );
            assert.equal((exprNode.value as any).left.kind, 'StringLiteral');
            assert.equal((exprNode.value as any).right.kind, 'Identifier');
          }
        },
        [tsExpr]
      );
    });

    test('links expression nodes in directive attribute values', () => {
      // Create a mock expression with some TypeScript AST-like properties
      const tsExpr = harness.createMockExpression({
        kind: 'PropertyAccessExpression',
        expression: {kind: 'Identifier', name: 'data'},
        name: 'value',
      });

      harness.testParse(
        '<input .value="${expr}">',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const input = fragment.childNodes[0] as Element;
          harness.assertElement(input, 'input');

          // Find the property attribute
          const propAttr = input.attrs.find(
            (a) =>
              a.type === 'Property' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === '.value'
              )
          );
          assert.isDefined(propAttr, 'Property attribute should exist');

          if (propAttr && propAttr.type === 'Property') {
            // Get the expression
            assert.equal(
              propAttr.value.length,
              1,
              'Should have one value part'
            );
            assert.equal(propAttr.value[0].type, 'LitHtmlExpression');

            const exprNode = propAttr.value[0] as LitHtmlExpression;

            // Check that it's linked to our original expression
            assert.isDefined(
              exprNode.value,
              'Expression value should be defined'
            );
            assert.isDefined(
              (exprNode.value as any).litHtmlExpression,
              'Expression should be linked'
            );

            // Check that TypeScript AST properties are preserved
            assert.equal(
              (exprNode.value as any).kind,
              'PropertyAccessExpression'
            );
            assert.equal((exprNode.value as any).expression.kind, 'Identifier');
            assert.equal((exprNode.value as any).expression.name, 'data');
            assert.equal((exprNode.value as any).name, 'value');
          }
        },
        [tsExpr]
      );
    });
  });

  suite('Complex TypeScript AST Integration', () => {
    test('handles complex expressions with nested properties', () => {
      // Create a mock expression with some complex TypeScript AST-like properties
      const tsExpr = harness.createMockExpression({
        kind: 'ConditionalExpression',
        condition: {
          kind: 'BinaryExpression',
          operator: '===',
          left: {kind: 'Identifier', name: 'status'},
          right: {kind: 'StringLiteral', value: 'active'},
        },
        whenTrue: {kind: 'StringLiteral', value: 'active'},
        whenFalse: {kind: 'StringLiteral', value: 'inactive'},
      });

      harness.testParse(
        '<div class="${expr}"></div>',
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
            // Get the expression
            const exprNode = classAttr.value[0] as LitHtmlExpression;

            // Check that it's linked to our original expression
            assert.isDefined(
              exprNode.value,
              'Expression value should be defined'
            );

            // Check that TypeScript AST properties are preserved throughout the tree
            assert.equal((exprNode.value as any).kind, 'ConditionalExpression');

            // Check condition part
            const condition = (exprNode.value as any).condition;
            assert.equal(condition.kind, 'BinaryExpression');
            assert.equal(condition.operator, '===');
            assert.equal(condition.left.kind, 'Identifier');
            assert.equal(condition.left.name, 'status');
            assert.equal(condition.right.kind, 'StringLiteral');
            assert.equal(condition.right.value, 'active');

            // Check whenTrue and whenFalse
            assert.equal(
              (exprNode.value as any).whenTrue.kind,
              'StringLiteral'
            );
            assert.equal((exprNode.value as any).whenTrue.value, 'active');
            assert.equal(
              (exprNode.value as any).whenFalse.kind,
              'StringLiteral'
            );
            assert.equal((exprNode.value as any).whenFalse.value, 'inactive');
          }
        },
        [tsExpr]
      );
    });

    test('handles multiple expressions with different TypeScript AST types', () => {
      // Create different mock expressions for different parts of the template
      const expr1 = harness.createMockExpression({
        kind: 'Identifier',
        name: 'title',
      });

      const expr2 = harness.createMockExpression({
        kind: 'PropertyAccessExpression',
        expression: {kind: 'Identifier', name: 'item'},
        name: 'description',
      });

      const expr3 = harness.createMockExpression({
        kind: 'CallExpression',
        expression: {kind: 'Identifier', name: 'handleClick'},
        arguments: [],
      });

      harness.testParse(
        '<div><h1>${expr}</h1><p>${expr}</p><button @click="${expr}">Click me</button></div>',
        (fragment) => {
          harness.assertChildCount(fragment, 1);
          const div = fragment.childNodes[0] as Element;
          harness.assertElement(div, 'div');

          // Check h1 with first expression
          harness.assertChildCount(div, 3);
          const h1 = div.childNodes[0] as Element;
          harness.assertElement(h1, 'h1');

          const expr1Node = h1.childNodes[0] as LitHtmlExpression;
          assert.equal(expr1Node.nodeName, '#lit-html-expression');
          assert.equal((expr1Node.value as any).kind, 'Identifier');
          assert.equal((expr1Node.value as any).name, 'title');

          // Check p with second expression
          const p = div.childNodes[1] as Element;
          harness.assertElement(p, 'p');

          const expr2Node = p.childNodes[0] as LitHtmlExpression;
          assert.equal(expr2Node.nodeName, '#lit-html-expression');
          assert.equal(
            (expr2Node.value as any).kind,
            'PropertyAccessExpression'
          );
          assert.equal((expr2Node.value as any).expression.name, 'item');

          // Check button with third expression (in event handler)
          const button = div.childNodes[2] as Element;
          harness.assertElement(button, 'button');

          const clickAttr = button.attrs.find(
            (a) =>
              a.type === 'Event' &&
              a.name.some(
                (n) => n.type === 'LitTagLiteral' && n.value === '@click'
              )
          );
          assert.isDefined(clickAttr, 'click event attribute should exist');

          if (clickAttr && clickAttr.type === 'Event') {
            const expr3Node = clickAttr.value[0] as LitHtmlExpression;
            assert.equal(expr3Node.type, 'LitHtmlExpression');
            assert.equal((expr3Node.value as any).kind, 'CallExpression');
            assert.equal(
              (expr3Node.value as any).expression.name,
              'handleClick'
            );
          }
        },
        [expr1, expr2, expr3]
      );
    });
  });
});
