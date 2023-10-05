/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import type ts from 'typescript';

import {
  AnalyzerTestContext,
  languages,
  setupAnalyzerForTest,
} from '../utils.js';
import {ClassDeclaration} from '../../../lib/model.js';
import {
  LitTemplateCommentNode,
  isLitTaggedTemplateExpression,
  parseLitTemplate,
} from '../../../lib/lit-html/template.js';
import {Element} from '@parse5/tools';

for (const lang of languages) {
  const test = suite<AnalyzerTestContext>(`lit-html tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'basic-elements');
  });

  test('isLitHtmlTemplateTag', ({getModule, analyzer, typescript}) => {
    const elementAModule = getModule('element-a')!;
    const decl = elementAModule.declarations[0];

    // get to the lit-html template tag
    const renderMethod = (decl as ClassDeclaration).getMethod('render')!;
    const statement = renderMethod.node.body!.statements[0];

    assert.is(typescript.isReturnStatement(statement), true);
    const returnStatement = statement as ts.ReturnStatement;
    assert.ok(returnStatement.expression);
    assert.is(
      typescript.isTaggedTemplateExpression(returnStatement.expression),
      true
    );
    const expression =
      returnStatement.expression as ts.TaggedTemplateExpression;
    assert.is(typescript.isIdentifier(expression.tag), true);
    assert.is(
      isLitTaggedTemplateExpression(
        expression,
        analyzer.typescript,
        analyzer.program.getTypeChecker()
      ),
      true
    );
  });

  test('parseLitTemplate', ({getModule, analyzer, typescript}) => {
    const elementAModule = getModule('element-a')!;
    const decl = elementAModule.declarations[0];
    const renderMethod = (decl as ClassDeclaration).getMethod('render')!;
    const statement = renderMethod.node.body!
      .statements[0] as ts.ReturnStatement;
    const expression = statement.expression as ts.TaggedTemplateExpression;
    assert.is(
      isLitTaggedTemplateExpression(
        expression,
        analyzer.typescript,
        analyzer.program.getTypeChecker()
      ),
      true
    );
    const litTemplate = parseLitTemplate(
      expression,
      typescript,
      analyzer.program.getTypeChecker()
    );
    assert.ok(litTemplate);
    assert.is(litTemplate.parts.length, 1);
    assert.is(litTemplate.strings.length, 2);

    const h1 = litTemplate.childNodes[0] as Element;
    assert.is(h1.nodeName, 'h1');
    const binding = h1.childNodes[0];
    assert.is(binding.nodeName, '#comment');
    const part = (binding as LitTemplateCommentNode).litPart;
    assert.ok(part);
    const bindingExpression = (binding as LitTemplateCommentNode).litPart!
      .expression;
    assert.is(bindingExpression.getText(), 'this.a');
    assert.is(litTemplate.parts[0], part);
  });

  test.run();
}
