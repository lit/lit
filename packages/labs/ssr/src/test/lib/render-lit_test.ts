/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ModuleLoader} from '../../lib/module-loader.js';
import {getWindow} from '../../lib/dom-shim.js';
import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {RenderInfo} from '../../index.js';
import {FallbackRenderer} from '../../lib/element-renderer.js';
import type * as testModule from '../test-files/render-test-module.js';
import {collectResultSync} from '../../lib/render-result.js';

/**
 * An empty VM context global. In more recent versions, when running in Node,
 * Lit automatically uses minimal shims for any missing APIs, so no globals are
 * required at all.
 */
const emptyVmGlobal = {};

/**
 * We still provide a global DOM shim that can be used as a VM context global.
 * In more recent versions of Lit, this is no longer required since Lit includes
 * its own minimal shims, but we still support the old global DOM shim as well.
 */
const shimmedVmGlobal = getWindow({
  includeJSBuiltIns: true,
});

for (const global of [emptyVmGlobal, shimmedVmGlobal]) {
  const loader = new ModuleLoader({global});

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

    return {
      ...namespace,

      /** Renders the value with declarative shadow roots */
      render(r: any, renderInfo?: Partial<RenderInfo>) {
        return collectResultSync(namespace.render(r, renderInfo));
      },

      /** Renders the value with flattened shadow roots */
      renderFlattened: (r: any) =>
        collectResultSync(namespace.render(r, undefined)),
    };
  };

  test('simple TemplateResult', async () => {
    const {render, simpleTemplateResult, digestForTemplateResult} =
      await setup();
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

  /* Iterable Expression */
  test('iterable expression with array value', async () => {
    const {render, templateWithIterableExpression} = await setup();
    const result = await render(
      templateWithIterableExpression(['foo', 'bar', 'baz'])
    );
    assert.is(
      result,
      `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--lit-part-->foo<!--/lit-part--><!--lit-part-->bar<!--/lit-part--><!--lit-part-->baz<!--/lit-part--><!--/lit-part--></div><!--/lit-part-->`
    );
  });

  test('iterable expression with set value', async () => {
    const {render, templateWithIterableExpression} = await setup();
    const result = await render(
      templateWithIterableExpression(new Set(['foo', 'bar', 'baz']))
    );
    assert.is(
      result,
      `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--lit-part-->foo<!--/lit-part--><!--lit-part-->bar<!--/lit-part--><!--lit-part-->baz<!--/lit-part--><!--/lit-part--></div><!--/lit-part-->`
    );
  });

  test('iterable expression with generator value', async () => {
    const {render, templateWithIterableExpression} = await setup();
    const result = await render(
      templateWithIterableExpression(
        (function* () {
          yield 'foo';
          yield 'bar';
          yield 'baz';
        })()
      )
    );
    assert.is(
      result,
      `<!--lit-part AEmR7W+R0Ak=--><div><!--lit-part--><!--lit-part-->foo<!--/lit-part--><!--lit-part-->bar<!--/lit-part--><!--lit-part-->baz<!--/lit-part--><!--/lit-part--></div><!--/lit-part-->`
    );
  });

  /* Attribute Expressions */

  test('attribute expression with string value', async () => {
    const {render, templateWithAttributeExpression} = await setup();
    const result = await render(templateWithAttributeExpression('foo'));
    assert.is(
      result,
      `<!--lit-part FAR9hgjJqTI=--><!--lit-node 0--><div class="foo"></div><!--/lit-part-->`
    );
  });

  test('input element with attribute expression with string value', async () => {
    const {render, inputTemplateWithAttributeExpression} = await setup();
    const result = await render(inputTemplateWithAttributeExpression('foo'));
    assert.is(
      result,
      `<!--lit-part AYwG7rAvcnw=--><!--lit-node 0--><input x="foo"><!--/lit-part-->`
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
      `<!--lit-part BIugdiAuV4I=--><!--lit-node 0--><input x="foo"><p>hi</p></input><!--/lit-part-->`
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
      `<!--lit-part FQlA2/EioQk=--><!--lit-node 0--><div x="foo" y="bar" z="not-dynamic"></div><!--/lit-part-->`
    );
  });

  test('attribute expression with multiple bindings', async () => {
    const {render, templateWithMultiBindingAttributeExpression} = await setup();
    const result = await render(
      templateWithMultiBindingAttributeExpression('foo', 'bar')
    );
    assert.is(
      result,
      `<!--lit-part D+PQMst9obo=--><!--lit-node 0--><div test="a foo b bar c"></div><!--/lit-part-->`
    );
  });

  /* Reflected property Expressions */

  test('HTMLInputElement.value', async () => {
    const {render, inputTemplateWithValueProperty} = await setup();
    const result = await render(inputTemplateWithValueProperty('foo'));
    assert.is(
      result,
      `<!--lit-part AxWziS+Adpk=--><!--lit-node 0--><input value="foo"><!--/lit-part-->`
    );
  });

  test('HTMLElement.className', async () => {
    const {render, elementTemplateWithClassNameProperty} = await setup();
    const result = await render(elementTemplateWithClassNameProperty('foo'));
    assert.is(
      result,
      `<!--lit-part I7NxrdZ/Zxo=--><!--lit-node 0--><div class="foo"></div><!--/lit-part-->`
    );
  });

  test('HTMLElement.classname does not reflect', async () => {
    const {render, elementTemplateWithClassnameProperty} = await setup();
    const result = await render(elementTemplateWithClassnameProperty('foo'));
    assert.is(
      result,
      `<!--lit-part I7NxrbZzZGA=--><!--lit-node 0--><div ></div><!--/lit-part-->`
    );
  });

  test('HTMLElement.id', async () => {
    const {render, elementTemplateWithIDProperty} = await setup();
    const result = await render(elementTemplateWithIDProperty('foo'));
    assert.is(
      result,
      `<!--lit-part IgnmhhM3LsA=--><!--lit-node 0--><div id="foo"></div><!--/lit-part-->`
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
      `<!--lit-part tjmYe1kHIVM=--><test-simple><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template></test-simple><!--/lit-part-->`
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
      `<!--lit-part tjmYe1kHIVM=--><test-simple defer-hydration><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template></test-simple><!--/lit-part-->`
    );
  });

  test(`Non-SSR'ed custom element`, async () => {
    const {render, templateWithNotRenderedElement} = await setup();

    const customElementsRendered: Array<string> = [];
    const result = await render(templateWithNotRenderedElement, {
      customElementRendered(tagName: string) {
        customElementsRendered.push(tagName);
      },
      elementRenderers: [FallbackRenderer],
    });
    // Undefined elements should not emit a declarative shadowroot
    assert.is(
      result,
      `<!--lit-part drPtGZnekSg=--><test-not-rendered></test-not-rendered><!--/lit-part-->`
    );
    assert.is(customElementsRendered.length, 1);
    assert.is(customElementsRendered[0], 'test-not-rendered');
  });

  test('element with property', async () => {
    const {render, elementWithProperty} = await setup();
    const result = await render(elementWithProperty);
    // TODO: we'd like to remove the extra space in the start tag
    assert.is(
      result,
      `<!--lit-part v2CxGIW+qHI=--><!--lit-node 0--><test-property ><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->bar<!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
    );
  });

  test('element with attribute', async () => {
    const {render, elementWithAttribute} = await setup();
    const result = await render(elementWithAttribute('bar'));
    // TODO: we'd like to remove the extra space in the start tag
    assert.is(
      result,
      `<!--lit-part ZI1U/5CYP1o=--><!--lit-node 0--><test-property  foo="bar"><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->bar<!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
    );
  });

  test('element with an empty string attribute', async () => {
    const {render, elementWithAttribute} = await setup();
    const result = await render(elementWithAttribute(''));
    // TODO: we'd like to remove the extra space in the start tag
    assert.is(
      result,
      `<!--lit-part ZI1U/5CYP1o=--><!--lit-node 0--><test-property  foo><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part--><!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
    );
  });

  test('element with an undefined attribute', async () => {
    const {render, elementWithAttribute} = await setup();
    const result = await render(elementWithAttribute(undefined));
    // TODO: we'd like to remove the extra space in the start tag
    assert.is(
      result,
      `<!--lit-part ZI1U/5CYP1o=--><!--lit-node 0--><test-property  foo><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part--><!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
    );
  });

  test('element with a null attribute', async () => {
    const {render, elementWithAttribute} = await setup();
    const result = await render(elementWithAttribute(null));
    // TODO: we'd like to remove the extra space in the start tag
    assert.is(
      result,
      `<!--lit-part ZI1U/5CYP1o=--><!--lit-node 0--><test-property  foo><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part--><!--/lit-part--></main><!--/lit-part--></template></test-property><!--/lit-part-->`
    );
  });

  test('element with mixed case attributes', async () => {
    const {render, templateWithMixedCaseAttrs} = await setup();
    const result = await render(templateWithMixedCaseAttrs('dynamic'));
    assert.is(
      result,
      `<!--lit-part F/N3wW1gNj8=--><!--lit-node 0--><svg dynamicCamel="dynamic" staticCamel="static"></svg><!--/lit-part-->`
    );
  });

  test('svg fragment template', async () => {
    const {render, svgTemplate} = await setup();
    const result = await render(svgTemplate(0, 0, 10));
    assert.is(
      result,
      `<!--lit-part qyEc9rpeBZw=--><!--lit-node 0--><circle cx="0" cy="0" r="10" /><!--/lit-part-->`
    );
  });

  test('html template type with svg template type ChildPart', async () => {
    const {render, templateWithSvgTemplate} = await setup();
    const result = await render(templateWithSvgTemplate(0, 0, 10));
    assert.is(
      result,
      `<!--lit-part eTJe7bZHqAs=--><svg><!--lit-part qyEc9rpeBZw=--><!--lit-node 0--><circle cx="0" cy="0" r="10" /><!--/lit-part--></svg><!--/lit-part-->`
    );
  });

  test('element with reflected properties', async () => {
    const {render, elementWithReflectedProperties} = await setup();
    const result = await render(elementWithReflectedProperties);
    // TODO: we'd like to remove the extra space in the start tag
    assert.is(
      result,
      `<!--lit-part 7z41MJchKXM=--><!--lit-node 0--><test-reflected-properties   bar baz="default reflected string" reflect-foo="badazzled"><template shadowroot="open" shadowrootmode="open"><!--lit-part--><!--/lit-part--></template></test-reflected-properties><!--/lit-part-->`
    );
  });

  test('element with default reflected properties', async () => {
    const {render, elementWithDefaultReflectedProperties} = await setup();
    const result = await render(elementWithDefaultReflectedProperties);
    assert.is(
      result,
      `<!--lit-part tktTsdmfB74=--><test-reflected-properties baz="default reflected string"><template shadowroot="open" shadowrootmode="open"><!--lit-part--><!--/lit-part--></template></test-reflected-properties><!--/lit-part-->`
    );
  });

  test('element with `willUpdate`', async () => {
    const {render, elementWithWillUpdate} = await setup();
    const result = await render(elementWithWillUpdate);
    // TODO: we'd like to remove the extra space in the start tag
    assert.is(
      result,
      `<!--lit-part Q0bbGrx71ic=--><!--lit-node 0--><test-will-update  ><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main><!--lit-part-->Foo Bar<!--/lit-part--></main><!--/lit-part--></template></test-will-update><!--/lit-part-->`
    );
  });

  /* Slots and Distribution */

  /* Declarative Shadow Root */

  test('no slot', async () => {
    const {render, noSlot} = await setup();
    const result = await render(noSlot);
    assert.is(
      result,
      `<!--lit-part OpS0yFtM48Q=--><test-simple><template shadowroot="open" shadowrootmode="open"><!--lit-part UNbWrd8S5FY=--><main></main><!--/lit-part--></template><p>Hi</p></test-simple><!--/lit-part-->`
    );
  });

  test('shadowroot="open"', async () => {
    const {render, shadowrootOpen} = await setup();
    const result = await render(shadowrootOpen);
    assert.is(
      result,
      `<!--lit-part eTOxy3auvsY=--><test-shadowroot-open><template shadowroot="open" shadowrootmode="open"><!--lit-part--><!--/lit-part--></template></test-shadowroot-open><!--/lit-part-->`
    );
  });

  test('shadowroot="closed"', async () => {
    const {render, shadowrootClosed} = await setup();
    const result = await render(shadowrootClosed);
    assert.is(
      result,
      `<!--lit-part 35tY6VC7KzI=--><test-shadowroot-closed><template shadowroot="closed" shadowrootmode="closed"><!--lit-part--><!--/lit-part--></template></test-shadowroot-closed><!--/lit-part-->`
    );
  });

  test('shadowrootdelegatesfocus', async () => {
    const {render, shadowrootdelegatesfocus} = await setup();
    const result = await render(shadowrootdelegatesfocus);
    assert.is(
      result,
      `<!--lit-part Nim07tlWyJ0=--><test-shadowrootdelegatesfocus><template shadowroot="open" shadowrootmode="open" shadowrootdelegatesfocus><!--lit-part--><!--/lit-part--></template></test-shadowrootdelegatesfocus><!--/lit-part-->`
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
      '<!--lit-part PkF/hiJU4II=--><!--lit-node 0--><div class=" a c "></div><!--/lit-part-->'
    );
  });

  test.skip('class-map directive with other bindings', async () => {
    const {render, classMapDirectiveMultiBinding} = await setup();
    const result = await render(classMapDirectiveMultiBinding);
    assert.is(
      result,
      '<!--lit-part pNgepkKFbd0=--><!--lit-node 0--><div class="z hi a c"></div><!--/lit-part-->'
    );
  });

  test('calls customElementRendered', () => {});

  /* Invalid Expression Locations */

  test('throws a descriptive error for invalid expression locations', async () => {
    const {render, templateUsingAnInvalidExpressLocation} = await setup();
    try {
      render(templateUsingAnInvalidExpressLocation());
    } catch (err: unknown) {
      assert.match(
        (err as Error).message,
        'Unexpected final partIndex: 0 !== 1 while processing the following template:'
      );
      assert.match(
        (err as Error).message,
        '<template><div>${...}</div></template>'
      );
      assert.match(
        (err as Error).message,
        'https://lit.dev/docs/templates/expressions/#invalid-locations'
      );
    }
  });
}

test.run();
