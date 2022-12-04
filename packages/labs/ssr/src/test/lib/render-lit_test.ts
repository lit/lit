/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'module';
import {ModuleLoader} from '../../lib/module-loader.js';
import {getWindow} from '../../lib/dom-shim.js';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {RenderInfo} from '../../index.js';

import type * as testModule from '../test-files/render-test-module.js';

const window = getWindow({
  includeJSBuiltIns: true,
  props: {require: createRequire(import.meta.url)},
});
const loader = new ModuleLoader({
  global: window,
});

/**
 * Promise for importing the "app module". This is a module that implements the
 * templates and elements to be SSRed. In this case it implements our test
 * cases.
 */
const appModuleImport = loader.importModule(
  '../test-files/render-test-module.js',
  import.meta.url
);

/* Real Tests */

/**
 * This test helper waits for the app module to load, and returns an object
 * with all the exports, and a render helper that renders a template to a
 * string.
 */
const setup = async () => {
  const namespace = (await appModuleImport).module
    .namespace as typeof testModule;

  /** Joins an iterable into a string */
  const collectResult = (iterable: Iterable<string>) => {
    let result = '';
    for (const chunk of iterable) {
      result += chunk;
    }
    return result;
  };

  return {
    ...namespace,

    /** Renders the value with declarative shadow roots */
    render(r: any, renderInfo?: Partial<RenderInfo>) {
      return collectResult(namespace.render(r, renderInfo));
    },

    /** Renders the value with flattened shadow roots */
    renderFlattened: (r: any) => collectResult(namespace.render(r, undefined)),
  };
};

test('simple TemplateResult', async () => {
  const {render, simpleTemplateResult, digestForTemplateResult} = await setup();
  const digest = digestForTemplateResult(simpleTemplateResult);
  const customElementsRendered: Array<string> = [];
  const result = await render(simpleTemplateResult, {
    customElementRendered(tagName: string) {
      customElementsRendered.push(tagName);
    },
  });
  assert.is(result, `<!--lit-part ${digest}--><div></div><!--/lit-part-->`);
  assert.is(customElementsRendered.length, 0);
});

/* Text Expressions */

test('text expression with string value', async () => {
  const {render, templateWithTextExpression} = await setup();
  const result = await render(templateWithTextExpression('foo'));
  assert.is(
    result,
    `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->foo<!--/lit-part--></div><!--/lit-part-->`
  );
});

test('text expression with undefined value', async () => {
  const {render, templateWithTextExpression} = await setup();
  const result = await render(templateWithTextExpression(undefined));
  assert.is(
    result,
    `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--/lit-part--></div><!--/lit-part-->`
  );
});

test('text expression with null value', async () => {
  const {render, templateWithTextExpression} = await setup();
  const result = await render(templateWithTextExpression(null));
  assert.is(
    result,
    `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--/lit-part--></div><!--/lit-part-->`
  );
});

/* Attribute Expressions */

test('attribute expression with string value', async () => {
  const {render, templateWithAttributeExpression} = await setup();
  const result = await render(templateWithAttributeExpression('foo'));
  assert.is(
    result,
    `<!--lit-part FAR9hgjJqTI=--><div class="foo"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

test('input element with attribute expression with string value', async () => {
  const {render, inputTemplateWithAttributeExpression} = await setup();
  const result = await render(inputTemplateWithAttributeExpression('foo'));
  assert.is(
    result,
    `<!--lit-part AYwG7rAvcnw=--><input x="foo"><!--lit-node 0--><!--/lit-part-->`
  );
});

test('input element with attribute expression with string value and child element', async () => {
  // Void elements like input will have their children hoisted to become
  // siblings by the HTML parser. In this case, we rely on the fact that any
  // <!--lit-node 0--> comments we create are prepended instead of appended,
  // so that they will be hoisted as the next sibling, so that we can use
  // .previousElementSibling to find the effective parent.
  const {render, inputTemplateWithAttributeExpressionAndChildElement} =
    await setup();
  const result = await render(
    inputTemplateWithAttributeExpressionAndChildElement('foo')
  );
  assert.is(
    result,
    `<!--lit-part BIugdiAuV4I=--><input x="foo"><!--lit-node 0--><p>hi</p></input><!--/lit-part-->`
  );
});

test('multiple attribute expressions with string value', async () => {
  const {render, templateWithMultipleAttributeExpressions} = await setup();
  const result = await render(
    templateWithMultipleAttributeExpressions('foo', 'bar')
  );
  // Has marker attribute for number of bound attributes.
  assert.is(
    result,
    `<!--lit-part FQlA2/EioQk=--><div x="foo" y="bar" z="not-dynamic"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

test('attribute expression with multiple bindings', async () => {
  const {render, templateWithMultiBindingAttributeExpression} = await setup();
  const result = await render(
    templateWithMultiBindingAttributeExpression('foo', 'bar')
  );
  assert.is(
    result,
    `<!--lit-part D+PQMst9obo=--><div test="a foo b bar c"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

/* Reflected property Expressions */

test('HTMLInputElement.value', async () => {
  const {render, inputTemplateWithValueProperty} = await setup();
  const result = await render(inputTemplateWithValueProperty('foo'));
  assert.is(
    result,
    `<!--lit-part AxWziS+Adpk=--><input value="foo"><!--lit-node 0--><!--/lit-part-->`
  );
});

test('HTMLElement.className', async () => {
  const {render, elementTemplateWithClassNameProperty} = await setup();
  const result = await render(elementTemplateWithClassNameProperty('foo'));
  assert.is(
    result,
    `<!--lit-part I7NxrdZ/Zxo=--><div class="foo"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

test('HTMLElement.classname does not reflect', async () => {
  const {render, elementTemplateWithClassnameProperty} = await setup();
  const result = await render(elementTemplateWithClassnameProperty('foo'));
  assert.is(
    result,
    `<!--lit-part I7NxrbZzZGA=--><div ><!--lit-node 0--></div><!--/lit-part-->`
  );
});

test('HTMLElement.id', async () => {
  const {render, elementTemplateWithIDProperty} = await setup();
  const result = await render(elementTemplateWithIDProperty('foo'));
  assert.is(
    result,
    `<!--lit-part IgnmhhM3LsA=--><div id="foo"><!--lit-node 0--></div><!--/lit-part-->`
  );
});

/* Nested Templates */

test('nested template', async () => {
  const {render, nestedTemplate} = await setup();
  const result = await render(nestedTemplate);
  assert.is(
    result,
    `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part P/cIB3F0dnw=--><p>Hi</p><!--/lit-part--></div><!--/lit-part-->`
  );
});

/* Custom Elements */

test('simple custom element', async () => {
  const {render, simpleTemplateWithElement} = await setup();

  const customElementsRendered: Array<string> = [];
  const result = await render(simpleTemplateWithElement, {
    customElementRendered(tagName: string) {
      customElementsRendered.push(tagName);
    },
  });
  assert.is(
    result,
    `<!--lit-part tjmYe1kHIVM=--><test-simple><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template></test-simple><!--/lit-part-->`
  );
  assert.is(customElementsRendered.length, 1);
  assert.is(customElementsRendered[0], 'test-simple');
});

test('simple custom element with deferHydration', async () => {
  const {render, simpleTemplateWithElement} = await setup();

  const result = await render(simpleTemplateWithElement, {
    deferHydration: true,
  });
  assert.is(
    result,
    `<!--lit-part tjmYe1kHIVM=--><test-simple defer-hydration><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template></test-simple><!--/lit-part-->`
  );
});

test('element with property', async () => {
  const {render, elementWithProperty} = await setup();
  const result = await render(elementWithProperty);
  // TODO: we'd like to remove the extra space in the start tag
  assert.is(
    result,
    `<!--lit-part v2CxGIW+qHI=--><test-property ><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->bar<!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
  );
});

test('element with attribute', async () => {
  const {render, elementWithAttribute} = await setup();
  const result = await render(elementWithAttribute('bar'));
  // TODO: we'd like to remove the extra space in the start tag
  assert.is(
    result,
    `<!--lit-part ZI1U/5CYP1o=--><test-property  foo="bar"><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->bar<!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
  );
});

test('element with an empty string attribute', async () => {
  const {render, elementWithAttribute} = await setup();
  const result = await render(elementWithAttribute(''));
  // TODO: we'd like to remove the extra space in the start tag
  assert.is(
    result,
    `<!--lit-part ZI1U/5CYP1o=--><test-property  foo><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part--><!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
  );
});

test('element with an undefined attribute', async () => {
  const {render, elementWithAttribute} = await setup();
  const result = await render(elementWithAttribute(undefined));
  // TODO: we'd like to remove the extra space in the start tag
  assert.is(
    result,
    `<!--lit-part ZI1U/5CYP1o=--><test-property  foo><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part--><!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
  );
});

test('element with a null attribute', async () => {
  const {render, elementWithAttribute} = await setup();
  const result = await render(elementWithAttribute(null));
  // TODO: we'd like to remove the extra space in the start tag
  assert.is(
    result,
    `<!--lit-part ZI1U/5CYP1o=--><test-property  foo><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part--><!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
  );
});

test('element with reflected properties', async () => {
  const {render, elementWithReflectedProperties} = await setup();
  const result = await render(elementWithReflectedProperties);
  // TODO: we'd like to remove the extra space in the start tag
  assert.is(
    result,
    `<!--lit-part 7z41MJchKXM=--><test-reflected-properties   bar baz="default reflected string" reflect-foo="badazzled"><!--lit-node 0--><template shadowroot="open"><!--lit-part--><!--/lit-part--></template></test-reflected-properties><!--/lit-part-->`
  );
});

test('element with default reflected properties', async () => {
  const {render, elementWithDefaultReflectedProperties} = await setup();
  const result = await render(elementWithDefaultReflectedProperties);
  assert.is(
    result,
    `<!--lit-part tktTsdmfB74=--><test-reflected-properties baz="default reflected string"><template shadowroot="open"><!--lit-part--><!--/lit-part--></template></test-reflected-properties><!--/lit-part-->`
  );
});

test('element with `willUpdate`', async () => {
  const {render, elementWithWillUpdate} = await setup();
  const result = await render(elementWithWillUpdate);
  // TODO: we'd like to remove the extra space in the start tag
  assert.is(
    result,
    `<!--lit-part Q0bbGrx71ic=--><test-will-update  ><!--lit-node 0--><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->Foo Bar<!--/lit-part--></main><!--/lit-part--></template></test-will-update><!--/lit-part-->`
  );
});

/* Slots and Distribution */

/* Declarative Shadow Root */

test('no slot', async () => {
  const {render, noSlot} = await setup();
  const result = await render(noSlot);
  assert.is(
    result,
    `<!--lit-part OpS0yFtM48Q=--><test-simple><template shadowroot="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template><p>Hi</p></test-simple><!--/lit-part-->`
  );
});

test('shadowroot="open"', async () => {
  const {render, shadowrootOpen} = await setup();
  const result = await render(shadowrootOpen);
  assert.is(
    result,
    `<!--lit-part eTOxy3auvsY=--><test-shadowroot-open><template shadowroot="open"><!--lit-part--><!--/lit-part--></template></test-shadowroot-open><!--/lit-part-->`
  );
});

test('shadowroot="closed"', async () => {
  const {render, shadowrootClosed} = await setup();
  const result = await render(shadowrootClosed);
  assert.is(
    result,
    `<!--lit-part 35tY6VC7KzI=--><test-shadowroot-closed><template shadowroot="closed"><!--lit-part--><!--/lit-part--></template></test-shadowroot-closed><!--/lit-part-->`
  );
});

test('shadowrootdelegatesfocus', async () => {
  const {render, shadowrootdelegatesfocus} = await setup();
  const result = await render(shadowrootdelegatesfocus);
  assert.is(
    result,
    `<!--lit-part Nim07tlWyJ0=--><test-shadowrootdelegatesfocus><template shadowroot="open" shadowrootdelegatesfocus><!--lit-part--><!--/lit-part--></template></test-shadowrootdelegatesfocus><!--/lit-part-->`
  );
});

/* Directives */

test('repeat directive with a template result', async () => {
  const {render, repeatDirectiveWithTemplateResult} = await setup();
  const result = await render(repeatDirectiveWithTemplateResult);
  assert.is(
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

test('repeat directive with a string', async () => {
  const {render, repeatDirectiveWithString} = await setup();
  const result = await render(repeatDirectiveWithString);
  assert.is(
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

test('simple class-map directive', async () => {
  const {render, classMapDirective} = await setup();
  const result = await render(classMapDirective);
  assert.is(
    result,
    '<!--lit-part PkF/hiJU4II=--><div class=" a c "><!--lit-node 0--></div><!--/lit-part-->'
  );
});

test.skip('class-map directive with other bindings', async () => {
  const {render, classMapDirectiveMultiBinding} = await setup();
  const result = await render(classMapDirectiveMultiBinding);
  assert.is(
    result,
    '<!--lit-part pNgepkKFbd0=--><div class="z hi a c"><!--lit-node 0--></div><!--/lit-part-->'
  );
});

test('calls customElementRendered', () => {});

test.run();
