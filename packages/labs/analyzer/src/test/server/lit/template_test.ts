/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as assert from 'node:assert';
import {describe as suite, test} from 'node:test';
import * as path from 'path';
import ts from 'typescript';
import * as url from 'url';
import {
  type Element,
  getLitTemplateExpressions,
  isLitTaggedTemplateExpression,
  type LitTemplateCommentNode,
  type ChildNode,
  parseLitTemplate,
} from '../../../lib/lit/template.js';
import type {ClassDeclaration} from '../../../lib/model.js';
import {languages, setupAnalyzerForNodeTest} from '../utils.js';

// Multi-language tests
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

const testFilesDir = url.fileURLToPath(
  new URL('../../../test-files/ts/templates', import.meta.url)
);

const getTestSourceFile = (filename: string) => {
  const program = ts.createProgram({
    rootNames: [filename],
    options: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(filename);
  if (sourceFile === undefined) {
    throw new Error(`Test file not found: ${filename}`);
  }
  return {sourceFile, checker};
};

/**
 * Asserts that the source locations for the given parse5 node are correct by
 * extracting source from the TypeScript TaggedTemplateExpression and comparing
 * the text to the expected value.
 */
const assertTemplateNodeText = (
  node: ChildNode,
  templateExpression: ts.TaggedTemplateExpression,
  expected: string
) => {
  // Trim off the leading and trailing backticks
  const templateText = templateExpression.template.getFullText().slice(1, -1);

  const {sourceCodeLocation} = node;
  const {startOffset, endOffset, startLine, startCol, endLine, endCol} =
    sourceCodeLocation!;

  // Check that the offsets are correct:
  const elementTextFromOffsets = templateText.substring(startOffset, endOffset);
  assert.equal(elementTextFromOffsets, expected);

  // Check that the lines and cols are correct
  const lines = templateText.split('\n');
  const elementTextFromLinesAndCols = lines
    .slice(startLine - 1, endLine)
    .map((line, i) => {
      const start = i === 0 ? startCol - 1 : 0;
      const end = i === endLine - startLine ? endCol - 1 : undefined;
      return line.slice(start, end);
    })
    .join('\n');
  assert.equal(elementTextFromLinesAndCols, expected);
};

suite('parseLitTemplate', () => {
  const testFilePath = path.resolve(testFilesDir, 'hello.ts');
  const {sourceFile, checker} = getTestSourceFile(testFilePath);
  const allTemplateExpressions = getLitTemplateExpressions(
    sourceFile,
    ts,
    checker
  );
  const templateExpressions = new Map<string, ts.TaggedTemplateExpression>();
  for (const templateExpression of allTemplateExpressions) {
    let parent = templateExpression.parent;
    while (
      parent !== undefined &&
      !ts.isVariableDeclaration(parent) &&
      !ts.isTaggedTemplateExpression(parent)
    ) {
      parent = parent.parent;
    }
    if (ts.isTaggedTemplateExpression(parent)) {
      continue;
    }
    if (parent !== undefined) {
      const {name} = parent as ts.VariableDeclaration;
      const functionName = name.getText();
      templateExpressions.set(functionName, templateExpression);
    }
  }

  suite('source location adjustment', () => {
    test('simple template', () => {
      const templateExpression = templateExpressions.get('simple')!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);
      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div,
        templateExpression,
        '<div>Hello, world!</div>'
      );
    });

    test('template with static child', () => {
      const templateExpression = templateExpressions.get('withChildren')!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div,
        templateExpression,
        '<div class="a"><span>A</span></div>'
      );

      const span = (div as Element).childNodes[0];
      assertTemplateNodeText(span, templateExpression, `<span>A</span>`);
    });

    test('template with child binding', () => {
      const templateExpression = templateExpressions.get('withChildBinding')!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div as Element,
        templateExpression,
        `<div class="a">\${'a'}<span>A</span></div>`
      );

      const marker = (div as Element).childNodes[0];
      assert.equal(marker.nodeName, '#comment');
      assertTemplateNodeText(marker, templateExpression, `\${'a'}`);

      const span = (div as Element).childNodes[1];
      assert.equal(span.nodeName, 'span');
      assertTemplateNodeText(span, templateExpression, `<span>A</span>`);
    });

    test('template with child binding with spaces', () => {
      const templateExpression = templateExpressions.get(
        'withChildBindingWithSpaces'
      )!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div as Element,
        templateExpression,
        `<div class="a">\${ 'a' }<span>A</span></div>`
      );

      const marker = (div as Element).childNodes[0];
      assert.equal(marker.nodeName, '#comment');
      assertTemplateNodeText(marker, templateExpression, `\${ 'a' }`);

      const span = (div as Element).childNodes[1];
      assert.equal(span.nodeName, 'span');
      assertTemplateNodeText(span, templateExpression, `<span>A</span>`);
    });

    test('template with attribute binding', () => {
      const templateExpression = templateExpressions.get(
        'withAttributeBinding'
      )!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div as Element,
        templateExpression,
        `<div class=\${'a'}><span>Hello, world!</span></div>`
      );

      const span = (div as Element).childNodes[0];
      assert.equal(span.nodeName, 'span');
      assertTemplateNodeText(
        span,
        templateExpression,
        `<span>Hello, world!</span>`
      );
    });

    test('template with quoted attribute binding', () => {
      const templateExpression = templateExpressions.get(
        'withQuotedAttributeBinding'
      )!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div as Element,
        templateExpression,
        `<div class="\${'a'}"><span>Hello, world!</span></div>`
      );

      const span = (div as Element).childNodes[0];
      assert.equal(span.nodeName, 'span');
      assertTemplateNodeText(
        span,
        templateExpression,
        `<span>Hello, world!</span>`
      );
    });

    test('template with multi attribute bindings', () => {
      const templateExpression = templateExpressions.get(
        'withMultiAttributeBinding'
      )!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div as Element,
        templateExpression,
        `<div class="\${'a'} \${'b'}"><span>Hello, world!</span></div>`
      );

      const span = (div as Element).childNodes[0];
      assert.equal(span.nodeName, 'span');
      assertTemplateNodeText(
        span,
        templateExpression,
        `<span>Hello, world!</span>`
      );
    });

    test('template with attribute binding with spaces', () => {
      const templateExpression = templateExpressions.get(
        'withAttributeBindingWithSpaces'
      )!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div as Element,
        templateExpression,
        `<div class=\${ 'a' }><span>Hello, world!</span></div>`
      );

      const span = (div as Element).childNodes[0];
      assert.equal(span.nodeName, 'span');
      assertTemplateNodeText(
        span,
        templateExpression,
        `<span>Hello, world!</span>`
      );
    });

    test('template with element binding', () => {
      const templateExpression = templateExpressions.get('withElementBinding')!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div as Element,
        templateExpression,
        `<div \${ref()}><span>Hello, world!</span></div>`
      );

      const span = (div as Element).childNodes[0];
      assert.equal(span.nodeName, 'span');
      assertTemplateNodeText(
        span,
        templateExpression,
        `<span>Hello, world!</span>`
      );
    });

    test('template with element binding with spaces', () => {
      const templateExpression = templateExpressions.get(
        'withElementBindingWithSpaces'
      )!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      const div = litTemplate.childNodes[0];
      assertTemplateNodeText(
        div as Element,
        templateExpression,
        `<div \${  ref()  }><span>Hello, world!</span></div>`
      );

      const span = (div as Element).childNodes[0];
      assert.equal(span.nodeName, 'span');
      assertTemplateNodeText(
        span,
        templateExpression,
        `<span>Hello, world!</span>`
      );
    });

    test('template with nested template', () => {
      const templateExpression = templateExpressions.get('nested')!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      // First child is text
      const div = litTemplate.childNodes[1];
      assertTemplateNodeText(
        div,
        templateExpression,
        `<div class="a">
    \${html\`<span>A</span>\`}
    <span></span>
  </div>`
      );
    });

    test('template with multi-line child expression', () => {
      const templateExpression = templateExpressions.get(
        'withMultiLineChildExpression'
      )!;
      const litTemplate = parseLitTemplate(templateExpression, ts, checker);

      // First child is text
      const div = litTemplate.childNodes[1];
      assertTemplateNodeText(
        div,
        templateExpression,
        `<div class="a">
    \${html\`
      <p>A</p>
      <p>B</p>
    \`}
  </div>`
      );
    });
  });

  test('template with multi-line attribute expression', () => {
    const templateExpression = templateExpressions.get(
      'withMultiLineAttributeExpression'
    )!;
    const litTemplate = parseLitTemplate(templateExpression, ts, checker);

    // First child is text
    const divA = litTemplate.childNodes[1];
    assertTemplateNodeText(
      divA,
      templateExpression,
      `<div class="\${[
    'a',
    'b'].join(' ')}">
    <span>A</span>
  </div>`
    );

    const divB = litTemplate.childNodes[3];
    assertTemplateNodeText(divB, templateExpression, `<div class="b"></div>`);
  });
});
