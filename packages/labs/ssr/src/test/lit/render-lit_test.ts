/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'module';
import {importModule} from '../../lib/import-module.js';
import {getWindow} from '../../lib/dom-shim.js';
import tape, {Test} from 'tape';
import tapePromiseLib from 'tape-promise';

const tapePromise = (tapePromiseLib as any).default as typeof tapePromiseLib;
const test = tapePromise(tape);

/**
 * Promise for importing the "app module". This is a module that implements the
 * templates and elements to be SSRed. In this case it implements our test
 * cases.
 */
const appModuleImport = importModule(
  '../test-files/render-test-module.js',
  import.meta.url,
  getWindow({require: createRequire(import.meta.url)})
);

/* Real Tests */

/**
 * This test helper waits for the app module to load, and returns an object
 * with all the exports, and a render helper that renders a template to a
 * string.
 */
const setup = async () => {
  const appModule = await appModuleImport;

  /** Joins an AsyncIterable into a string */
  const collectResult = async (iterable: AsyncIterable<string>) => {
    let result = '';
    for await (const chunk of iterable) {
      result += chunk;
    }
    return result;
  };

  return {
    ...appModule.namespace,

    /** Renders the value with declarative shadow roots */
    render: (r: any) => collectResult(appModule.namespace.render(r)),

    /** Renders the value with flattened shadow roots */
    renderFlattened: (r: any) =>
      collectResult(appModule.namespace.render(r, undefined, true)),
  };
};

test('simple TemplateResult', async (t: Test) => {
  const {render, simpleTemplateResult, digestForTemplateResult} = await setup();
  const digest = digestForTemplateResult(simpleTemplateResult);
  const result = await render(simpleTemplateResult);
  t.equal(result, `<!--lit-part ${digest}--><div></div><!--/lit-part-->`);
});

/* Text Expressions */

test('text expression with string value', async (t: Test) => {
  const {render, templateWithTextExpression} = await setup();
  const result = await render(templateWithTextExpression('foo'));
  t.equal(
    result,
    `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->foo<!--/lit-part--></div><!--/lit-part-->`
  );
});

test('text expression with undefined value', async (t: Test) => {
  const {render, templateWithTextExpression} = await setup();
  const result = await render(templateWithTextExpression(undefined));
  t.equal(
    result,
    `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--/lit-part--></div><!--/lit-part-->`
  );
});

test('text expression with null value', async (t: Test) => {
  const {render, templateWithTextExpression} = await setup();
  const result = await render(templateWithTextExpression(null));
  t.equal(
    result,
    `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--/lit-part--></div><!--/lit-part-->`
  );
});

/* Attribute Expressions */

test('attribute expression with string value', async (t: Test) => {
  const {render, templateWithAttributeExpression} = await setup();
  const result = await render(templateWithAttributeExpression('foo'));
  // TODO: test for the marker comment for attribute binding
  t.equal(
    result,
    `<!--lit-part FAR9hgjJqTI=--><div class="foo"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

test('multiple attribute expressions with string value', async (t: Test) => {
  const {render, templateWithMultipleAttributeExpressions} = await setup();
  const result = await render(
    templateWithMultipleAttributeExpressions('foo', 'bar')
  );
  // Has marker attribute for number of bound attributes.
  t.equal(
    result,
    `<!--lit-part FQlA2/EioQk=--><div x="foo" y="bar" z="not-dynamic"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

test('attribute expression with multiple bindings', async (t: Test) => {
  const {render, templateWithMultiBindingAttributeExpression} = await setup();
  const result = await render(
    templateWithMultiBindingAttributeExpression('foo', 'bar')
  );
  t.equal(
    result,
    `<!--lit-part D+PQMst9obo=--><div test="a foo b bar c"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

/* Reflected property Expressions */

test('HTMLInputElement.value', async (t: Test) => {
  const {render, inputTemplateWithValueProperty} = await setup();
  const result = await render(inputTemplateWithValueProperty('foo'));
  t.equal(
    result,
    `<!--lit-part AxWziS+Adpk=--><input value="foo"><!--lit-node 0--><!--/lit-part-->`
  );
});

test('HTMLElement.className', async (t: Test) => {
  const {render, elementTemplateWithClassNameProperty} = await setup();
  const result = await render(elementTemplateWithClassNameProperty('foo'));
  t.equal(
    result,
    `<!--lit-part I7NxrdZ/Zxo=--><div class="foo"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

test('HTMLElement.classname does not reflect', async (t: Test) => {
  const {render, elementTemplateWithClassnameProperty} = await setup();
  const result = await render(elementTemplateWithClassnameProperty('foo'));
  t.equal(
    result,
    `<!--lit-part I7NxrbZzZGA=--><div ><!--lit-node 0--></div><!--/lit-part-->`
  );
});

test('HTMLElement.id', async (t: Test) => {
  const {render, elementTemplateWithIDProperty} = await setup();
  const result = await render(elementTemplateWithIDProperty('foo'));
  t.equal(
    result,
    `<!--lit-part IgnmhhM3LsA=--><div id="foo"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

/* Nested Templates */

test('nested template', async (t: Test) => {
  const {render, nestedTemplate} = await setup();
  const result = await render(nestedTemplate);
  t.equal(
    result,
    `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part P/cIB3F0dnw=--><p>Hi</p><!--/lit-part--></div><!--/lit-part-->`
  );
});

/* Custom Elements */

test('simple custom element', async (t: Test) => {
  const {render, simpleTemplateWithElement} = await setup();
  const result = await render(simpleTemplateWithElement);
  t.equal(
    result,
    `<!--lit-part tjmYe1kHIVM=--><test-simple><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template></test-simple><!--/lit-part-->`
  );
});

test('element with property', async (t: Test) => {
  const {render, elementWithProperty} = await setup();
  const result = await render(elementWithProperty);
  // TODO: we'd like to remove the extra space in the start tag
  t.equal(
    result,
    `<!--lit-part v2CxGIW+qHI=--><test-property ><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->bar<!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
  );
});

test('element with `willUpdate`', async (t: Test) => {
  const {render, elementWithWillUpdate} = await setup();
  const result = await render(elementWithWillUpdate);
  // TODO: we'd like to remove the extra space in the start tag
  t.equal(
    result,
    `<!--lit-part Q0bbGrx71ic=--><test-will-update  ><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->Foo Bar<!--/lit-part--></main><!--/lit-part--></template></test-will-update><!--/lit-part-->`
  );
});

/* Slots and Distribution */

/* Declarative Shadow Root */

test('no slot', async (t: Test) => {
  const {render, noSlot} = await setup();
  const result = await render(noSlot);
  t.equal(
    result,
    `<!--lit-part OpS0yFtM48Q=--><test-simple><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template><p>Hi</p></test-simple><!--/lit-part-->`
  );
});

/* Directives */

test('repeat directive with a template result', async (t: Test) => {
  const {render, repeatDirectiveWithTemplateResult} = await setup();
  const result = await render(repeatDirectiveWithTemplateResult);
  t.equal(
    result,
    '<!--lit-part AEmR7W+R0Ak=-->' +
      '<div>' +
      '<!--lit-part-->' + // part that wraps the directive
      '<!--lit-part AgkKByTWdnw=-->' + // part for child template 0
      '<p><!--lit-part-->0<!--/lit-part-->) <!--lit-part-->foo<!--/lit-part--></p>' +
      '<!--/lit-part-->' +
      '<!--lit-part AgkKByTWdnw=-->' + // part for child template 1
      '<p><!--lit-part-->1<!--/lit-part-->) <!--lit-part-->bar<!--/lit-part--></p>' +
      '<!--/lit-part-->' +
      '<!--lit-part AgkKByTWdnw=-->' + // part for child template 2
      '<p><!--lit-part-->2<!--/lit-part-->) <!--lit-part-->qux<!--/lit-part--></p>' +
      '<!--/lit-part-->' +
      '<!--/lit-part-->' +
      '</div>' +
      '<!--/lit-part-->'
  );
});

test('repeat directive with a string', async (t: Test) => {
  const {render, repeatDirectiveWithString} = await setup();
  const result = await render(repeatDirectiveWithString);
  t.equal(
    result,
    '<!--lit-part BRUAAAUVAAA=-->' +
      '<!--lit-part-->' + // part that wraps the directive
      '<!--lit-part-->' + // part for child template 0
      'foo' +
      '<!--/lit-part-->' +
      '<!--lit-part-->' + // part for child template 1
      'bar' +
      '<!--/lit-part-->' +
      '<!--lit-part-->' + // part for child template 2
      'qux' +
      '<!--/lit-part-->' +
      '<!--/lit-part-->' +
      '<?>' + // endNode for template instance since it had no
      // static end node
      '<!--/lit-part-->'
  );
});

test('simple class-map directive', async (t: Test) => {
  const {render, classMapDirective} = await setup();
  const result = await render(classMapDirective);
  t.equal(
    result,
    '<!--lit-part PkF/hiJU4II=--><div class="a c"><!--lit-node 0--></div><!--/lit-part-->'
  );
});

test.skip('class-map directive with other bindings', async (t: Test) => {
  const {render, classMapDirectiveMultiBinding} = await setup();
  const result = await render(classMapDirectiveMultiBinding);
  t.equal(
    result,
    '<!--lit-part pNgepkKFbd0=--><div class="z hi a c"><!--lit-node 0--></div><!--/lit-part-->'
  );
});
