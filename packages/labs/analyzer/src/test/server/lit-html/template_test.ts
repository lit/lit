/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test, describe as suite} from 'node:test';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import type ts from 'typescript';

import {languages, setupAnalyzerForNodeTest} from '../utils.js';
import {ClassDeclaration} from '../../../lib/model.js';
import {isLitTaggedTemplateExpression} from '../../../lib/lit-html/template.js';

for (const lang of languages) {
  suite(`lit-html template tests (${lang})`, () => {
    const {getModule, analyzer, typescript} = setupAnalyzerForNodeTest(
      lang,
      'basic-elements'
    );

    test('isLitHtmlTemplateTag', () => {
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
  });
}
