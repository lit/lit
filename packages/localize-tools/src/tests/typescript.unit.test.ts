/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {parseStringAsTemplateLiteral} from '../typescript.js';

test('parses a no-substitution template literal body', () => {
  const node = parseStringAsTemplateLiteral('Hello World');
  assert.ok(ts.isNoSubstitutionTemplateLiteral(node));
  assert.is((node as ts.NoSubstitutionTemplateLiteral).text, 'Hello World');
});

test('parses an identifier substitution as an Identifier', () => {
  const node = parseStringAsTemplateLiteral('Hello ${name}!');
  assert.ok(ts.isTemplateExpression(node));
  const span = (node as ts.TemplateExpression).templateSpans[0];
  assert.ok(ts.isIdentifier(span.expression));
  assert.is((span.expression as ts.Identifier).text, 'name');
});

// Regression test for a bug where TypeScript generic call expressions inside
// ${...} substitutions were misparsed as a chain of comparison operators.
//
// Given `${foo<T>(arg)}`, parsing the template literal body with
// `ts.ScriptKind.JS` would yield `(foo < T) > (arg)` (a BinaryExpression) and
// any consumer that re-emitted the AST would print `foo < T > (arg)`, which
// at runtime evaluates to `false` and silently drops the call's side effects.
// Parsing with `ts.ScriptKind.TS` correctly recognizes `<T>` as a type
// argument list and produces a CallExpression.
test('parses a generic call expression substitution as a CallExpression', () => {
  const node = parseStringAsTemplateLiteral("<b>${fn<T>({a: 'x'})}</b>");
  assert.ok(ts.isTemplateExpression(node));
  const expr = (node as ts.TemplateExpression).templateSpans[0].expression;
  assert.ok(
    ts.isCallExpression(expr),
    `Expected CallExpression, got ${ts.SyntaxKind[expr.kind]}. ` +
      `This indicates the template literal body was parsed as JavaScript ` +
      `instead of TypeScript, causing the generic call to be misparsed as a ` +
      `chain of comparison operators.`
  );
  const call = expr as ts.CallExpression;
  assert.ok(ts.isIdentifier(call.expression));
  assert.is((call.expression as ts.Identifier).text, 'fn');
  assert.is(call.typeArguments?.length, 1);
  assert.is(call.arguments.length, 1);
});

test('parses nested generic call substitutions correctly', () => {
  const node = parseStringAsTemplateLiteral(
    'a ${foo<T>()} b ${bar<U, V>(1)} c'
  );
  assert.ok(ts.isTemplateExpression(node));
  const spans = (node as ts.TemplateExpression).templateSpans;
  assert.is(spans.length, 2);
  assert.ok(ts.isCallExpression(spans[0].expression));
  assert.ok(ts.isCallExpression(spans[1].expression));
  assert.is(
    (spans[1].expression as ts.CallExpression).typeArguments?.length,
    2
  );
});

test.run();
