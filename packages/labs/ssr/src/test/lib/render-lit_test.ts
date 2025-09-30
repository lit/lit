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

  test('render into a <script>', async () => {
    const {render, renderScript} = await setup();
    assert.throws(() => {
      render(renderScript);
    }, "This could be because you're attempting to render an expression in an invalid location.");
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

  test('multiple attribute expressions with string value preceded by element expression', async () => {
    const {render, templateWithElementAndMultipleAttributeExpressions} =
      await setup();
    const result = await render(
      templateWithElementAndMultipleAttributeExpressions('foo', 'bar')
    );
    // Has marker attribute for number of bound attributes.
    assert.is(
      result,
      `<!--lit-part NdVlqfEioQk=--><!--lit-node 0--><div  x="foo" y="bar" z="not-dynamic"></div><!--/lit-part-->`
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

  test('math fragment template', async () => {
    const {render, mathTemplate} = await setup();
    const result = await render(mathTemplate(0));
    assert.is(
      result,
      `<!--lit-part eIU1B9cAcXw=--><mn><!--lit-part-->0<!--/lit-part--></mn><!--/lit-part-->`
    );
  });

  test('html template type with math template type ChildPart', async () => {
    const {render, templateWithMathTemplate} = await setup();
    const result = await render(templateWithMathTemplate(0));
    assert.is(
      result,
      `<!--lit-part q5ZurYRhi1g=--><math><!--lit-part eIU1B9cAcXw=--><mn><!--lit-part-->0<!--/lit-part--></mn><!--/lit-part--></math><!--/lit-part-->`
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

  /* Events */

  test('events with parent and child', async () => {
    const {render, eventParentAndSingleChildWithoutValue, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    try {
      const result = await render(eventParentAndSingleChildWithoutValue);
      assert.is(
        result,
        '<!--lit-part RSGZngXXsLg=--><test-events-parent><template shadowroot="open" shadowrootmode="open"><style>\n' +
          '    :host {\n' +
          '      display: block;\n' +
          '    }\n' +
          '  </style><!--lit-part LLTdYazTGBk=--><main><slot></slot></main><!--/lit-part--></template>' +
          '<test-events-child data-test><template shadowroot="open" shadowrootmode="open"><!--lit-part Ux1Wl2m85Zk=--><div>events child</div><!--/lit-part--></template></test-events-child></test-events-parent><!--/lit-part-->'
      );
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:1}',
        'test-events-parent{id:0}/capture/CAPTURING_PHASE/test-events-child{id:1}',
        'slot{id:2,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:1}',
        'test-events-child{id:1}/capture/AT_TARGET/test-events-child{id:1}',
        'test-events-child{id:1}/non-capture/AT_TARGET/test-events-child{id:1}',
        'slot{id:2,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:1}',
        'test-events-parent{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:1}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:1}',
      ]);
    } finally {
      reset();
    }
  });

  test('events with parent with value and child', async () => {
    const {render, eventParentAndSingleChildWithValue, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    try {
      const result = await render(eventParentAndSingleChildWithValue);
      assert.is(
        result,
        '<!--lit-part pLrHZ32UrRU=--><test-events-parent  value="my-test"><template shadowroot="open" shadowrootmode="open"><style>\n' +
          '    :host {\n' +
          '      display: block;\n' +
          '    }\n' +
          '  </style><!--lit-part LLTdYazTGBk=--><main><slot></slot></main><!--/lit-part--></template>' +
          '<test-events-child data-test="my-test"><template shadowroot="open" shadowrootmode="open"><!--lit-part Ux1Wl2m85Zk=--><div>events child</div><!--/lit-part--></template></test-events-child></test-events-parent><!--/lit-part-->'
      );
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:1}',
        'test-events-parent{id:0}/capture/CAPTURING_PHASE/test-events-child{id:1}',
        'slot{id:2,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:1}',
        'test-events-child{id:1}/capture/AT_TARGET/test-events-child{id:1}',
        'test-events-child{id:1}/non-capture/AT_TARGET/test-events-child{id:1}',
        'slot{id:2,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:1}',
        'test-events-parent{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:1}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:1}',
      ]);
    } finally {
      reset();
    }
  });

  test('event order with capture from top and bubbles from bottom', async () => {
    const {render, eventParentNesting, setupEvents} = await setup();
    const {eventPath, reset} = setupEvents();
    try {
      const result = await render(eventParentNesting);
      assert.is(
        result,
        '<!--lit-part 4D0mmmUOBvU=--><test-events-parent   capture="oc" value="ov"><template shadowroot="open" shadowrootmode="open"><style>\n' +
          '    :host {\n' +
          '      display: block;\n' +
          '    }\n' +
          '  </style><!--lit-part LLTdYazTGBk=--><main><slot></slot></main><!--/lit-part--></template>\n' +
          '  <test-events-parent   capture="ic" value="iv"><template shadowroot="open" shadowrootmode="open"><style>\n' +
          '    :host {\n' +
          '      display: block;\n' +
          '    }\n' +
          '  </style><!--lit-part LLTdYazTGBk=--><main><slot></slot></main><!--/lit-part--></template>' +
          '<test-events-child data-test="ocicivov"><template shadowroot="open" shadowrootmode="open"><!--lit-part Ux1Wl2m85Zk=--><div>events child</div><!--/lit-part--></template></test-events-child>' +
          '</test-events-parent></test-events-parent><!--/lit-part-->'
      );
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-parent{id:0}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot{id:2,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-parent{id:1}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot{id:4,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-child{id:3}/capture/AT_TARGET/test-events-child{id:3}',
        'test-events-child{id:3}/non-capture/AT_TARGET/test-events-child{id:3}',
        'slot{id:4,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'test-events-parent{id:1}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'slot{id:2,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'test-events-parent{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
      ]);
    } finally {
      reset();
    }
  });

  test('event order through shadow DOM', async () => {
    const {render, eventShadowNested, setupEvents} = await setup();
    const {eventPath, reset} = setupEvents();
    try {
      const result = await render(eventShadowNested);
      assert.is(
        result,
        '<!--lit-part QSPfkaBogFk=--><test-events-parent  value="my-test"><template shadowroot="open" shadowrootmode="open"><style>\n' +
          '    :host {\n' +
          '      display: block;\n' +
          '    }\n' +
          '  </style><!--lit-part LLTdYazTGBk=--><main><slot></slot></main><!--/lit-part--></template>' +
          '<test-events-shadow-nested><template shadowroot="open" shadowrootmode="open"><!--lit-part GQHLzN3QO5Q=--><slot></slot><!--lit-node 1--><test-events-parent  value="shadow" defer-hydration>' +
          '<template shadowroot="open" shadowrootmode="open"><style>\n' +
          '    :host {\n' +
          '      display: block;\n' +
          '    }\n' +
          '  </style><!--lit-part LLTdYazTGBk=--><main><slot></slot></main><!--/lit-part--></template><slot name="a"></slot></test-events-parent><!--/lit-part--></template>\n' +
          '  <div><test-events-child data-test="my-test"><template shadowroot="open" shadowrootmode="open"><!--lit-part Ux1Wl2m85Zk=--><div>events child</div><!--/lit-part--></template></test-events-child>' +
          '</div><div slot="a"><test-events-child data-test="shadowmy-test"><template shadowroot="open" shadowrootmode="open"><!--lit-part Ux1Wl2m85Zk=--><div>events child</div><!--/lit-part--></template></test-events-child></div>\n' +
          '  </test-events-shadow-nested></test-events-parent><!--/lit-part-->'
      );
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        // Event from first child
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:5}',
        'test-events-parent{id:0}/capture/CAPTURING_PHASE/test-events-child{id:5}',
        'slot{id:2,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:5}',
        'test-events-shadow-nested{id:1}/capture/CAPTURING_PHASE/test-events-child{id:5}',
        'slot{id:4,host:test-events-shadow-nested}/capture/CAPTURING_PHASE/test-events-child{id:5}',
        'test-events-child{id:5}/capture/AT_TARGET/test-events-child{id:5}',
        'test-events-child{id:5}/non-capture/AT_TARGET/test-events-child{id:5}',
        'slot{id:4,host:test-events-shadow-nested}/non-capture/BUBBLING_PHASE/test-events-child{id:5}',
        'test-events-shadow-nested{id:1}/non-capture/BUBBLING_PHASE/test-events-child{id:5}',
        'slot{id:2,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:5}',
        'test-events-parent{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:5}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:5}',
        // Event from second child
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'test-events-parent{id:0}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'slot{id:2,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'test-events-shadow-nested{id:1}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'slot{id:4,host:test-events-shadow-nested}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'test-events-parent{id:3,host:test-events-shadow-nested}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'slot{id:7,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'slot[name=a]{id:8,host:test-events-shadow-nested}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'test-events-child{id:6}/capture/AT_TARGET/test-events-child{id:6}',
        'test-events-child{id:6}/non-capture/AT_TARGET/test-events-child{id:6}',
        'slot[name=a]{id:8,host:test-events-shadow-nested}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'slot{id:7,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'test-events-parent{id:3,host:test-events-shadow-nested}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'slot{id:4,host:test-events-shadow-nested}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'test-events-shadow-nested{id:1}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'slot{id:2,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'test-events-parent{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
      ]);
    } finally {
      reset();
    }
  });

  test('event path skips shadow DOM with non-existent slot usage', async () => {
    const {render, eventParentAndSingleWithNonExistentSlot, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    try {
      await render(eventParentAndSingleWithNonExistentSlot);
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:1}',
        'test-events-parent{id:0}/capture/CAPTURING_PHASE/test-events-child{id:1}',
        'test-events-child{id:1}/capture/AT_TARGET/test-events-child{id:1}',
        'test-events-child{id:1}/non-capture/AT_TARGET/test-events-child{id:1}',
        'test-events-parent{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:1}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:1}',
      ]);
    } finally {
      reset();
    }
  });

  test('event target is correct without composed', async () => {
    const {render, eventChildShadowNested, setupEvents} = await setup();
    const {eventPath, reset} = setupEvents();
    try {
      await render(eventChildShadowNested);
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'test-events-child{id:1,host:test-events-child-shadow-nested}/capture/AT_TARGET/test-events-child{id:1}',
        'test-events-child{id:1,host:test-events-child-shadow-nested}/non-capture/AT_TARGET/test-events-child{id:1}',
      ]);
    } finally {
      reset();
    }
  });

  test('event target is correct with composed', async () => {
    const {render, TestEventsChild, eventChildShadowNested, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    TestEventsChild.eventOptions = {composed: true};
    try {
      await render(eventChildShadowNested);
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child-shadow-nested{id:0}',
        'test-events-child-shadow-nested{id:0}/capture/AT_TARGET/test-events-child-shadow-nested{id:0}',
        'test-events-child{id:1,host:test-events-child-shadow-nested}/capture/AT_TARGET/test-events-child{id:1}',
        'test-events-child{id:1,host:test-events-child-shadow-nested}/non-capture/AT_TARGET/test-events-child{id:1}',
        'test-events-child-shadow-nested{id:0}/non-capture/AT_TARGET/test-events-child-shadow-nested{id:0}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child-shadow-nested{id:0}',
      ]);
    } finally {
      delete TestEventsChild.eventOptions;
      reset();
    }
  });

  test('event target is correct with twice nested shadow DOM', async () => {
    const {render, TestEventsChild, eventChildShadowNestedTwice, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    TestEventsChild.eventOptions = {composed: true};
    try {
      await render(eventChildShadowNestedTwice);
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child-shadow-nested-twice{id:0}',
        'test-events-child-shadow-nested-twice{id:0}/capture/AT_TARGET/test-events-child-shadow-nested-twice{id:0}',
        'test-events-child-shadow-nested{id:1,host:test-events-child-shadow-nested-twice}/capture/AT_TARGET/test-events-child-shadow-nested{id:1}',
        'test-events-child{id:2,host:test-events-child-shadow-nested}/capture/AT_TARGET/test-events-child{id:2}',
        'test-events-child{id:2,host:test-events-child-shadow-nested}/non-capture/AT_TARGET/test-events-child{id:2}',
        'test-events-child-shadow-nested{id:1,host:test-events-child-shadow-nested-twice}/non-capture/AT_TARGET/test-events-child-shadow-nested{id:1}',
        'test-events-child-shadow-nested-twice{id:0}/non-capture/AT_TARGET/test-events-child-shadow-nested-twice{id:0}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child-shadow-nested-twice{id:0}',
      ]);
    } finally {
      delete TestEventsChild.eventOptions;
      reset();
    }
  });

  test('event target works with nested slots with named slot child', async () => {
    const {render, eventNestedSlotWithNamedSlotChild, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    try {
      await render(eventNestedSlotWithNamedSlotChild);
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-nested-slots{id:0}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot{id:2,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-parent{id:1,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot{id:4,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot[name=a]{id:5,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-child{id:3}/capture/AT_TARGET/test-events-child{id:3}',
        'test-events-child{id:3}/non-capture/AT_TARGET/test-events-child{id:3}',
        'slot[name=a]{id:5,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'slot{id:4,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'test-events-parent{id:1,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'slot{id:2,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'test-events-nested-slots{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
      ]);
    } finally {
      reset();
    }
  });

  test('event target works with nested slots with unnamed slot child', async () => {
    const {render, eventNestedSlotWithUnnamedSlotChild, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    try {
      await render(eventNestedSlotWithUnnamedSlotChild);
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-nested-slots{id:0}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot{id:2,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-child{id:3}/capture/AT_TARGET/test-events-child{id:3}',
        'test-events-child{id:3}/non-capture/AT_TARGET/test-events-child{id:3}',
        'slot{id:2,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'test-events-nested-slots{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
      ]);
    } finally {
      reset();
    }
  });

  test('event target works with nested slots with unnamed and named slot child', async () => {
    const {render, eventNestedSlotWithUnnamedAndNamedSlotChild, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    try {
      await render(eventNestedSlotWithUnnamedAndNamedSlotChild);
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        // Event from first child
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-nested-slots{id:0}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot{id:2,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-child{id:3}/capture/AT_TARGET/test-events-child{id:3}',
        'test-events-child{id:3}/non-capture/AT_TARGET/test-events-child{id:3}',
        'slot{id:2,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'test-events-nested-slots{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        // Event from second child
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:4}',
        'test-events-nested-slots{id:0}/capture/CAPTURING_PHASE/test-events-child{id:4}',
        'slot{id:2,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:4}',
        'test-events-parent{id:1,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:4}',
        'slot{id:5,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:4}',
        'slot[name=a]{id:6,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:4}',
        'test-events-child{id:4}/capture/AT_TARGET/test-events-child{id:4}',
        'test-events-child{id:4}/non-capture/AT_TARGET/test-events-child{id:4}',
        'slot[name=a]{id:6,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:4}',
        'slot{id:5,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:4}',
        'test-events-parent{id:1,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:4}',
        'slot{id:2,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:4}',
        'test-events-nested-slots{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:4}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:4}',
      ]);
    } finally {
      reset();
    }
  });

  test('event target works with nested slots with named and unnamed slot child', async () => {
    const {render, eventNestedSlotWithNamedAndUnnamedSlotChild, setupEvents} =
      await setup();
    const {eventPath, reset} = setupEvents();
    try {
      await render(eventNestedSlotWithNamedAndUnnamedSlotChild);
      // structuredClone is necessary, as the identity across module loader is not equal.
      assert.equal(structuredClone(eventPath), [
        // Event from first child
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-nested-slots{id:0}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot{id:2,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-parent{id:1,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot{id:4,host:test-events-parent}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'slot[name=a]{id:5,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:3}',
        'test-events-child{id:3}/capture/AT_TARGET/test-events-child{id:3}',
        'test-events-child{id:3}/non-capture/AT_TARGET/test-events-child{id:3}',
        'slot[name=a]{id:5,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'slot{id:4,host:test-events-parent}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'test-events-parent{id:1,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'slot{id:2,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'test-events-nested-slots{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:3}',
        // Event from second child
        'lit-server-root/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'test-events-nested-slots{id:0}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'slot{id:2,host:test-events-nested-slots}/capture/CAPTURING_PHASE/test-events-child{id:6}',
        'test-events-child{id:6}/capture/AT_TARGET/test-events-child{id:6}',
        'test-events-child{id:6}/non-capture/AT_TARGET/test-events-child{id:6}',
        'slot{id:2,host:test-events-nested-slots}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'test-events-nested-slots{id:0}/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
        'lit-server-root/non-capture/BUBBLING_PHASE/test-events-child{id:6}',
      ]);
    } finally {
      reset();
    }
  });

  test('enableUpdating is prevented from being called', async () => {
    const {
      render,
      TestEventsParent,
      eventParentAndSingleChildWithoutValue,
      setupEvents,
    } = await setup();
    const {reset} = setupEvents();
    let connectedCallbackCalls = 0;
    let createRenderRootCalls = 0;
    // We can't track calls to enableUpdating, as it is dynamically created
    // but we can track calls to scheduleUpdate, which would be called if
    // enableUpdating was called normally.
    let scheduleUpdateCalls = 0;
    const spyOn = (methodName: string, increment: () => void) => {
      const method = (TestEventsParent.prototype as any)[methodName];
      (TestEventsParent.prototype as any)[methodName] = function () {
        increment();
        return method.call(this);
      };
      return () => ((TestEventsParent.prototype as any)[methodName] = method);
    };
    const spies = [
      spyOn('connectedCallback', () => connectedCallbackCalls++),
      spyOn('createRenderRoot', () => createRenderRootCalls++),
      spyOn('scheduleUpdate', () => scheduleUpdateCalls++),
    ];
    try {
      await render(eventParentAndSingleChildWithoutValue);
      assert.equal(connectedCallbackCalls, 1);
      assert.equal(createRenderRootCalls, 1);
      assert.equal(scheduleUpdateCalls, 0);
    } finally {
      spies.forEach((s) => s());
      reset();
    }
  });

  test('controller hostConnected is called', async () => {
    const {
      render,
      TestEventsParent,
      eventParentAndSingleChildWithoutValue,
      setupEvents,
    } = await setup();
    const {reset} = setupEvents();
    try {
      let controllerHostConnectedCalls = 0;
      TestEventsParent.testInitializer = (el) =>
        el.addController({
          hostConnected() {
            controllerHostConnectedCalls++;
          },
        });

      await render(eventParentAndSingleChildWithoutValue);
      assert.equal(controllerHostConnectedCalls, 1);
    } finally {
      TestEventsParent.testInitializer = undefined;
      reset();
    }
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

  test('server-only templates', async () => {
    const {render, trivialServerOnly} = await setup();
    const result = await render(trivialServerOnly);
    assert.is(result, `<div>Server only</div>`);
  });

  test('server-only template with a binding', async () => {
    const {render, serverOnlyWithBinding} = await setup();
    const result = await render(serverOnlyWithBinding);
    assert.is(result, `<div>Server only</div>`);
  });

  test('server-only template with an array', async () => {
    const {render, serverOnlyArray} = await setup();
    const result = await render(serverOnlyArray);
    assert.is(result, `<div>onetwothree</div>`);
  });

  test('server-only template inside server-only template', async () => {
    const {render, serverOnlyInsideServerOnly} = await setup();
    const result = await render(serverOnlyInsideServerOnly);
    assert.is(result, `<div>Server only</div>`);
  });

  test(`server-only template can render a normal template`, async () => {
    const {render, serverOnlyRenderHydratable} = await setup();
    const result = render(serverOnlyRenderHydratable);
    assert.is(
      result,
      `
    <div>server only</div>
    <!--lit-part AEmR7W+R0Ak=--><div><!--lit-part-->hydratable<!--/lit-part--></div><!--/lit-part-->
  `
    );
  });

  test(`normal template can't render a server-only template`, async () => {
    const {render, hydratableRenderServerOnly} = await setup();
    assert.throws(
      () => render(hydratableRenderServerOnly),
      /A server-only template can't be rendered inside an ordinary, hydratable template./
    );
  });

  test('server-only template into raw element', async () => {
    const {render, serverOnlyRawElementTemplate} = await setup();
    const result = await render(serverOnlyRawElementTemplate);
    assert.is(
      result,
      `
    <title>No comments inside</title>
    <textarea>This also works.</textarea>
  `
    );
  });

  test('server-only template into a <template> element', async () => {
    const {render, serverOnlyInTemplateElement} = await setup();
    const result = await render(serverOnlyInTemplateElement);
    assert.is(
      result,
      `
    <template>one<div>two<div>three</div><template>recursed</template></div></template>
  `
    );
  });

  test('server-only document template can render an entire document', async () => {
    const {render, serverOnlyDocumentTemplate} = await setup();
    const result = await render(serverOnlyDocumentTemplate);
    assert.is(
      result,
      `
    <!DOCTYPE html>
    <html>
      <head>
        <title>No comments inside</title>
      </head>
      <body>
        <textarea>This also works.</textarea>
      </body>
    </html>
  `
    );
  });

  // Regression test for https://github.com/lit/lit/issues/4417
  test('server-only template can bind attributes to html tag', async () => {
    const {render, serverOnlyBindAttributeOnHtml} = await setup();
    const result = await render(serverOnlyBindAttributeOnHtml);
    assert.is(
      result,
      `
<!DOCTYPE html>
<html lang="ko"></html>
`
    );
  });

  test('client templates cannot bind attributes to the html tag', async () => {
    const {render, nonServerTemplateBindAttributeOnHtmlShouldError} =
      await setup();
    assert.throws(
      () => {
        render(nonServerTemplateBindAttributeOnHtmlShouldError);
      },
      // TODO: This error message could be improved to be more descriptive. A
      // top level html tag should only be used in a server-only template.
      /Unexpected final partIndex/
    );
  });

  test('server-only document templates compose', async () => {
    const {render, serverOnlyDocumentTemplatesCompose} = await setup();
    const result = await render(serverOnlyDocumentTemplatesCompose);
    assert.is(
      result,
      `
<!DOCTYPE html>
<html lang="ko">
  <head>
    <title>Server only title</title>
  </head>
  <body>
    <p>Content</p>
    <table><tr><td>Table content</td></tr></table>
  </body>
</html>
`
    );
  });

  test('server-only page elements supports bindings', async () => {
    const {render, serverOnlyPageElementsSupportBindings} = await setup();
    const result = await render(serverOnlyPageElementsSupportBindings);
    assert.is(
      result.trim(),
      `<!-- A multi
     line comment -->
<html lang="ko">
  <p>Hello, world!</p>
</html>`
    );
  });

  test('server-only top level body element support bindings', async () => {
    const {render, serverOnlyBodyElementSupportsBindings} = await setup();
    const result = await render(serverOnlyBodyElementSupportsBindings);
    assert.is(
      result,
      `\n<!-- A multi
     line comment -->
<body class="testClass">
  <p>Body Contents!</p>
</body>\n`
    );
  });

  test('server-only top level head element with comment supports bindings', async () => {
    const {render, serverOnlyHeadWithComment} = await setup();
    const result = await render(serverOnlyHeadWithComment);
    assert.is(
      result,
      `\n<!-- Head content -->
<head attr-key="attrValue">
</head>\n`
    );
  });

  test('server-only top level head element supports bindings', async () => {
    const {render, serverOnlyHeadTagComposition} = await setup();
    const result = await render(serverOnlyHeadTagComposition);
    assert.is(
      result,
      `\n<head attr-key="attrValue">
  <title attr-key="attrValue">Document title!</title>
</head>\n`
    );
  });

  // Regression test for https://github.com/lit/lit/issues/4513
  test('server-only table templates can contain attribute bindings', async () => {
    const {render, serverOnlyTdTag} = await setup();
    const result = await render(serverOnlyTdTag);
    assert.is(result, `<td colspan="2">Table content</td>`);
  });

  // Regression test for https://github.com/lit/lit/issues/4513
  test('server-only table templates can contain attribute bindings and have comment', async () => {
    const {render, serverOnlyTdTagWithCommentPrefix} = await setup();
    const result = await render(serverOnlyTdTagWithCommentPrefix);
    assert.is(
      result,
      `<!-- HTML comment --><td colspan="3">Table content</td>`
    );
  });

  test('server-only template throws on property bindings', async () => {
    const {render, serverOnlyRenderPropertyBinding} = await setup();
    assert.throws(
      () => render(serverOnlyRenderPropertyBinding),
      /Server-only templates can't bind to properties./
    );
  });

  test('server-only template throws on event bindings', async () => {
    const {render, serverOnlyRenderEventBinding} = await setup();
    assert.throws(
      () => render(serverOnlyRenderEventBinding),
      /Server-only templates can't bind to events./
    );
  });

  test('server-only template into a <script>', async () => {
    const {render, renderServerOnlyScript, renderServerOnlyScriptDeep} =
      await setup();
    assert.throws(
      () => render(renderServerOnlyScript),
      /Found binding inside an executable <script> tag in a server-only template\./
    );
    assert.throws(
      () => render(renderServerOnlyScriptDeep),
      /Found binding inside an executable <script> tag in a server-only template\./
    );
  });

  test('server-only template into a <style>', async () => {
    const {render, renderServerOnlyStyle, renderServerOnlyStyleDeep} =
      await setup();
    assert.throws(
      () => render(renderServerOnlyStyle),
      /Found binding inside a <style> tag in a server-only template\./
    );
    assert.throws(
      () => render(renderServerOnlyStyleDeep),
      /Found binding inside a <style> tag in a server-only template\./
    );
  });

  test('server-only template into non-executing script', async () => {
    const {render, renderServerScriptNotJavaScript} = await setup();
    const result = render(renderServerScriptNotJavaScript);
    assert.is(
      result,
      `
  <script type="json">
    {"ok": true}
  </script>`
    );
  });

  test('server-only template with element part', async () => {
    const {render, renderServerOnlyElementPart} = await setup();

    assert.throws(() => {
      render(renderServerOnlyElementPart);
    }, /Server-only templates don't support element parts/);
  });
}

test.run();
