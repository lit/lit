/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, mathml, svg, nothing} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {classMap} from 'lit/directives/class-map.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {LitElement, css, PropertyValues} from 'lit';
import {property, customElement} from 'lit/decorators.js';
import {html as serverhtml} from '../../lib/server-template.js';
export {digestForTemplateResult} from '@lit-labs/ssr-client';

export {render} from '../../lib/render-lit-html.js';

/* Real Tests */
// prettier-ignore
export const simpleTemplateResult = html`<div></div>`;

/* Text Expressions */
// prettier-ignore
export const templateWithTextExpression = (x: string|null|undefined) => html`<div>${x}</div>`;

/* Iterable Expression */
// prettier-ignore
export const templateWithIterableExpression = (x: Iterable<string>) => html`<div>${x}</div>`;

/* Attribute Expressions */
// prettier-ignore
export const templateWithAttributeExpression = (x: string) =>
  html`<div class=${x}></div>`;
// prettier-ignore
export const templateWithMultipleAttributeExpressions = (
  x: string,
  y: string
) => html`<div x=${x} y=${y} z="not-dynamic"></div>`;
// prettier-ignore
export const templateWithElementAndMultipleAttributeExpressions = (
  x: string,
  y: string
) => html`<div ${ref(createRef())} x=${x} y=${y} z="not-dynamic"></div>`;
// prettier-ignore
export const templateWithMultiBindingAttributeExpression = (
  x: string,
  y: string
) => html`<div test="a ${x} b ${y} c"></div>`;
// prettier-ignore
export const inputTemplateWithAttributeExpression = (x: string) =>
html`<input x=${x}>`;
// prettier-ignore
export const inputTemplateWithAttributeExpressionAndChildElement = (x: string) =>
  html`<input x=${x}><p>hi</p></input>`;
// prettier-ignore
export const templateWithMixedCaseAttrs = (str: string) => html`<svg dynamicCamel=${str} staticCamel="static"></svg>`;
// prettier-ignore
export const svgTemplate = (x: number, y: number, r: number) => svg`<circle cx="${x}" cy="${y}" r="${r}" />`;
// prettier-ignore
export const templateWithSvgTemplate = (x: number, y: number, r: number) => html`<svg>${svgTemplate(x, y, r)}</svg>`;
// prettier-ignore
export const mathTemplate = (x: number) => mathml`<mn>${x}</mn>`;
// prettier-ignore
export const templateWithMathTemplate = (x: number) => html`<math>${mathTemplate(x)}</math>`;

/* Reflected Property Expressions */

// prettier-ignore
export const inputTemplateWithValueProperty = (x: string) =>
  html`<input .value=${x}>`;
// prettier-ignore
export const elementTemplateWithClassNameProperty = (x: string) =>
  html`<div .className=${x}></div>`;
// prettier-ignore
export const elementTemplateWithClassnameProperty = (x: string) =>
  html`<div .classname=${x}></div>`;
// prettier-ignore
export const elementTemplateWithIDProperty = (x: string) =>
  html`<div .id=${x}></div>`;

/* Nested Templates */
// prettier-ignore
export const nestedTemplate = html`<div>${html`<p>Hi</p>`}</div>`;

/* Custom Elements */

@customElement('test-simple')
export class TestSimple extends LitElement {
  override render() {
    // prettier-ignore
    return html`<main></main>`;
  }
}

// prettier-ignore
export const simpleTemplateWithElement = html`<test-simple></test-simple>`;

// This must be excluded from rendering in the test
@customElement('test-not-rendered')
export class NotRendered extends LitElement {}

// prettier-ignore
export const templateWithNotRenderedElement = html`<test-not-rendered></test-not-rendered>`;

@customElement('test-property')
export class TestProperty extends LitElement {
  @property() foo?: string;

  override render() {
    // prettier-ignore
    return html`<main>${this.foo}</main>`;
  }
}

// prettier-ignore
export const elementWithProperty = html`<test-property .foo=${'bar'}></test-property>`;
export const elementWithAttribute = (x: string | undefined | null) =>
  html`<test-property foo=${x}></test-property>`;

@customElement('test-reflected-properties')
export class TestReflectedProperties extends LitElement {
  @property({type: String, reflect: true, attribute: 'reflect-foo'})
  foo?: string;
  @property({type: Boolean, reflect: true}) bar = false;
  @property({type: String, reflect: true}) baz = 'default reflected string';
}

// prettier-ignore
export const elementWithReflectedProperties = html`<test-reflected-properties .foo=${'badazzled'} .bar=${true}></test-reflected-properties>`;

// prettier-ignore
export const elementWithDefaultReflectedProperties = html`<test-reflected-properties></test-reflected-properties>`;

@customElement('test-will-update')
export class TestWillUpdate extends LitElement {
  @property()
  first?: string;
  @property()
  last?: string;
  fullName = '';

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('first') || changedProperties.has('last')) {
      this.fullName = `${this.first} ${this.last}`;
    }
  }

  override render() {
    // prettier-ignore
    return html`<main>${this.fullName}</main>`;
  }
}

// prettier-ignore
export const elementWithWillUpdate = html`<test-will-update .first=${'Foo'} .last=${'Bar'}></test-will-update>`;

/* Slots and Distribution */
// prettier-ignore
export const noSlot = html`<test-simple><p>Hi</p></test-simple>`;

@customElement('test-simple-slot')
export class TestSlot extends LitElement {
  override render() {
    // prettier-ignore
    return html`<main><slot></slot></main>`;
  }
}

// prettier-ignore
export const slotWithStaticChild = html`<test-simple-slot><p>Hi</p></test-simple-slot>`;

// prettier-ignore
export const slotWithStaticChildren = html`<test-simple-slot><h1>Yo</h1><p>Hi</p></test-simple-slot>`;
// prettier-ignore
const dynamicChild = html`<p>Hi</p>`;

// prettier-ignore
export const slotWithDynamicChild = html`<test-simple-slot>${dynamicChild}</test-simple-slot>`;

// prettier-ignore
export const slotWithDynamicChildAndMore = html`<test-simple-slot>${dynamicChild}</test-simple-slot>${42}`;

// prettier-ignore
export const slotWithReusedDynamicChild = html`<test-simple-slot>${dynamicChild}</test-simple-slot>${dynamicChild}`;

@customElement('test-two-slots')
export class TestTwoSlots extends LitElement {
  override render() {
    // prettier-ignore
    return html`<main><slot></slot></main>
      <slot name="a"></slot>`;
  }
}

// prettier-ignore
export const twoSlotsWithStaticChildren = html`<test-two-slots><h1>Yo</h1><p slot="a">Hi</p></test-two-slots>`;

// prettier-ignore
export const twoSlotsWithStaticChildrenOutOfOrder = html`<test-two-slots><p slot="a">Hi</p><h1>Yo</h1></test-two-slots>`;

// prettier-ignore
export const twoSlotsWithDynamicChildren = html`<test-two-slots>${html`<h1>Yo</h1><p slot="a">Hi</p>`}</test-two-slots>`;

// prettier-ignore
export const twoSlotsWithDynamicChildrenOutOfOrder = html`<test-two-slots>${html`<p slot="a">Hi</p><h1>Yo</h1>`}</test-two-slots>`;

@customElement('test-dynamic-slot')
export class TestDynamicSlot extends LitElement {
  @property({type: Boolean}) renderSlot = true;
  override render() {
    // prettier-ignore
    return html`${this.renderSlot ? html`<slot></slot>` : nothing}`;
  }
}
// prettier-ignore
export const dynamicSlot = (renderSlot: boolean) =>
  html`<test-dynamic-slot .renderSlot=${renderSlot}><p>Hi</p></test-dynamic-slot>`;

@customElement('test-styles')
export class TestStyles extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;
}

/* Directives */

// prettier-ignore
export const repeatDirectiveWithTemplateResult = html`<div>${repeat(['foo', 'bar', 'qux'], (name: string, i: number) => html`<p>${i}) ${name}</p>`)}</div>`;

// prettier-ignore
export const repeatDirectiveWithString = html`${repeat(['foo', 'bar', 'qux'], (name: string) => name)}`;

// prettier-ignore
export const classMapDirective = html`<div class="${classMap({a: true, b: false, c: true})}"></div>`;

// prettier-ignore
export const classMapDirectiveMultiBinding = html`<div class="z ${'hi'} ${classMap({a: true, b: false, c: true})}"></div>`;

// Tests to do:
//  - simple template, no expressions
//  - simple template, text expressions
//  - simple template, attribute expressions
//  - compound template
//  - hydration of above
//  - template w/ custom element, no expressions
//  - template w/ custom element, expressions in outer and element templates
//  - template w/ custom element, <slot>, static children in outer template
//  - template w/ custom element, named <slot>, static children in outer template
//  - template w/ custom element, named <slot>, children in nested template
//  - dynamic <slot>s

// This setup tests
//  - that we render and slot children from deeply nested templates
//  - that we keep distributed node state per TemplateResult _value_, not per
//    TemplateResult, because of the reuse of the inner result.
// prettier-ignore
export const nestedTemplateResult = html`<div></div>`;
// prettier-ignore
export const trickyNestedDynamicChildren = html`<test-simple-slot
  >${html`${nestedTemplateResult}${nestedTemplateResult}`}</test-simple-slot
>`;

@customElement('test-shadowroot-open')
export class TestShadowrootOpen extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    mode: 'open' as const,
  };
}

export const shadowrootOpen = html`<test-shadowroot-open></test-shadowroot-open>`;

@customElement('test-shadowroot-closed')
export class TestShadowrootClosed extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    mode: 'closed' as const,
  };
}

export const shadowrootClosed = html`<test-shadowroot-closed></test-shadowroot-closed>`;

@customElement('test-shadowrootdelegatesfocus')
export class TestShadowrootdelegatesfocus extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
}

export const shadowrootdelegatesfocus = html`<test-shadowrootdelegatesfocus></test-shadowrootdelegatesfocus>`;

/* Invalid Expression Locations */
export const templateUsingAnInvalidExpressLocation = () => {
  const value = 'Invalid expression location';
  return html`<template><div>${value}</div></template>`;
};

export const trivialServerOnly = serverhtml`<div>Server only</div>`;

export const serverOnlyWithBinding = serverhtml`<div>${'Server only'}</div>`;

export const serverOnlyInsideServerOnly = serverhtml`<div>${serverhtml`Server only`}</div>`;

export const serverOnlyRawElementTemplate = serverhtml`
    <title>${'No'} comments ${'inside'}</title>
    <textarea>${'This also'} works${'.'}</textarea>
  `;

export const serverOnlyInTemplateElement = serverhtml`
    <template>${'one'}<div>${'two'}<div>${'three'}</div><template>${'recursed'}</template></div></template>
  `;

export const serverOnlyDocumentTemplate = serverhtml`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${'No'} comments ${'inside'}</title>
      </head>
      <body>
        <textarea>${'This also'} works${'.'}</textarea>
      </body>
    </html>
  `;

export const serverOnlyBindAttributeOnHtml = serverhtml`
<!DOCTYPE html>
<html lang="${'ko'}"></html>
`;

export const nonServerTemplateBindAttributeOnHtmlShouldError = html`
  <!doctype html>
  <html lang="${'ko'}"></html>
`;

export const serverOnlyDocumentTemplatesCompose = serverhtml`
${serverhtml`<!DOCTYPE html>`}
${serverhtml`<html lang="${'ko'}">
  ${serverhtml`<head>
    ${serverhtml`<title>${'Server only title'}</title>`}
  </head>`}
  ${serverhtml`<body>
    ${serverhtml`<p>${'Content'}</p>`}
    ${serverhtml`<table>${serverhtml`<tr>${serverhtml`<td>${'Table content'}</td>`}</tr>`}</table>`}
  </body>`}
</html>`}
`;

export const serverOnlyPageElementsSupportBindings = serverhtml`
<!-- A multi
     line comment -->
<html lang="${'ko'}">
  <p>${'Hello, world!'}</p>
</html>`;

export const serverOnlyBodyElementSupportsBindings = serverhtml`
<!-- A multi
     line comment -->
<body class="${'testClass'}">
  <p>${'Body Contents!'}</p>
</body>
`;

export const serverOnlyHeadWithComment = serverhtml`
<!-- Head content -->
<head attr-key=${'attrValue'}>
</head>
`;

export const serverOnlyHeadTagComposition = serverhtml`
<head attr-key=${'attrValue'}>
  ${serverhtml`<title attr-key=${'attrValue'}>${'Document title!'}</title>`}
</head>
`;

export const serverOnlyTdTag = serverhtml`<td colspan=${2}>${'Table content'}</td>`;

export const serverOnlyTdTagWithCommentPrefix = serverhtml`<!-- HTML comment --><td colspan=${3}>${'Table content'}</td>`;

export const serverOnlyArray = serverhtml`<div>${[
  'one',
  'two',
  'three',
]}</div>`;

export const serverOnlyRenderHydratable = serverhtml`
    <div>${'server only'}</div>
    ${html`<div>${'hydratable'}</div>`}
  `;

export const hydratableRenderServerOnly = html`
  <div>${'dynamic!'}</div>
  ${serverhtml`<div>${'one time'}</div>`}
`;

export const serverOnlyRenderPropertyBinding = serverhtml`<div .foo=${'server only'}></div>`;

export const serverOnlyRenderEventBinding = serverhtml`<div @click=${() =>
  console.log('clicked!')}></div>`;

export const renderScript = html` <script>
  console.log('${'This is dangerous!'}');
</script>`;

export const renderServerOnlyScript = serverhtml`
  <script>
    console.log("${'This is dangerous!'}");
  </script>`;

export const renderServerOnlyScriptDeep = serverhtml`
  <script>
    <div>
      console.log("${'This is dangerous!'}");
    </div>
  </script>`;

export const renderServerOnlyStyle = serverhtml`
  <style>
    div {
      color: ${'red'};
    }
  </style>`;

export const renderServerOnlyStyleDeep = serverhtml`
  <style>
    <div>
      color: ${'red'};
    </div>
  </style>`;

export const renderServerScriptNotJavaScript = serverhtml`
  <script type="json">
    {"ok": ${true}}
  </script>`;

// This doesn't have to make sense, the test is that it'll throw at the
// template preparation phase.
export const renderServerOnlyElementPart = serverhtml`<div ${'foo'}></div>`;
