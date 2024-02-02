/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test, describe as suite} from 'node:test';
import * as assert from 'node:assert';
import type ts from 'typescript';

import {languages, setupAnalyzerForNodeTest} from '../utils.js';
import {ClassDeclaration} from '../../../lib/model.js';
import {
  LitTemplateCommentNode,
  isLitTaggedTemplateExpression,
  parseLitTemplate,
} from '../../../lib/lit-html/template.js';
import {Element} from '@parse5/tools';

for (const lang of languages) {
  suite(`lit-html template utility tests (${lang})`, () => {
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
      assert.equal(typescript.isReturnStatement(statement), true);
      const returnStatement = statement as ts.ReturnStatement;
      assert.ok(returnStatement.expression);
      assert.equal(
        typescript.isTaggedTemplateExpression(returnStatement.expression),
        true
      );
      const expression =
        returnStatement.expression as ts.TaggedTemplateExpression;
      assert.equal(typescript.isIdentifier(expression.tag), true);
      assert.equal(
        isLitTaggedTemplateExpression(
          expression,
          analyzer.typescript,
          analyzer.program.getTypeChecker()
        ),
        true
      );
    });

    test('parseLitTemplate', () => {
      const elementAModule = getModule('element-a')!;
      const decl = elementAModule.declarations[0];
      const renderMethod = (decl as ClassDeclaration).getMethod('render')!;
      const statement = renderMethod.node.body!
        .statements[0] as ts.ReturnStatement;
      const expression = statement.expression as ts.TaggedTemplateExpression;
      assert.equal(
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
      assert.equal(litTemplate.parts.length, 1);
      assert.equal(litTemplate.strings.length, 2);

      const h1 = litTemplate.childNodes[0] as Element;
      assert.equal(h1.nodeName, 'h1');
      const binding = h1.childNodes[0];
      assert.equal(binding.nodeName, '#comment');
      const part = (binding as LitTemplateCommentNode).litPart;
      assert.ok(part);
      const bindingExpression = (binding as LitTemplateCommentNode).litPart!
        .expression;
      assert.equal(bindingExpression.getText(), 'this.a');
      assert.equal(litTemplate.parts[0], part);
    });
  });
}
