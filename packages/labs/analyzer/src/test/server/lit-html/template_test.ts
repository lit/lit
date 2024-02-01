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
import {isLitTaggedTemplateExpression} from '../../../lib/lit-html/template.js';

for (const lang of languages) {
  const test = suite<AnalyzerTestContext>(`lit-html tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'basic-elements');
  });

  test('isLitHtmlTemplateTag', ({getModule, analyzer, typescript}) => {
    const elementAModule = getModule('element-a')!;
    console.log('elementAModule.jsPath', elementAModule.sourcePath);
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

    // console.log('template', returnStatement.expression);
  });

  test.run();
}
