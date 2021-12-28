/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {getComputedStyleValue, generateElementName} from './test-helpers';
import {assert} from '@esm-bundle/chai';
import {PartsMixin} from '../mixin.js';
import {define, part, createStyle} from '../parts.js';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  LitElement.disableWarning?.('change-in-update');
}

suite('Parts', () => {
  let container: HTMLElement;

  const myElementTag = 'my-element';
  const parts = define(['header', 'main', 'footer'], myElementTag);

  const headerSelector = `[part=my-element_header]`;

  class MyElement extends PartsMixin(LitElement) {
    static parts = parts;
    static override styles = css`
      ${parts.header.def} {
        padding-top: 10px;
      }
    `;

    header!: HTMLDivElement;

    override render() {
      return html`
        <div ${part(parts.header)}>Header</div>
        <div ${part(parts.main)}>Main</div>
        <div ${part(parts.footer)}>Footer</div>
      `;
    }

    override firstUpdated() {
      this.header = this.renderRoot.querySelector(headerSelector)!;
    }
  }
  customElements.define(myElementTag, MyElement);

  const otherElementTag = 'other-element';
  const otherParts = define(['a', 'b', 'c'], otherElementTag);

  class OtherElement extends PartsMixin(LitElement) {
    static parts = otherParts;

    a!: HTMLDivElement;

    override render() {
      return html`
        <div ${part(otherParts.a)}>A</div>
        <div ${part(otherParts.b)}>B</div>
        <div ${part(otherParts.c)}>C</div>
      `;
    }

    override firstUpdated() {
      this.a = this.renderRoot.firstElementChild! as HTMLDivElement;
    }
  }
  customElements.define(otherElementTag, OtherElement);

  class ShadowElement extends HTMLElement {
    renderRoot: ShadowRoot;
    constructor() {
      super();
      const mode = this.hasAttribute('closed') ? 'closed' : 'open';
      this.renderRoot = this.attachShadow({mode});
    }
  }
  customElements.define('shadow-el', ShadowElement);

  const nestShadowEl = (n: Element | ShadowRoot, closed = false) => {
    n.innerHTML = `<shadow-el ${closed ? 'closed' : ''}></shadow-el>`;
    return n.firstChild as ShadowElement;
  };

  const getExports = (e: Element) => e.getAttribute('exportparts')!.split(',');

  let el: MyElement;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    el = new MyElement();
    container.appendChild(el);
    await el.updateComplete;
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('can define parts', () => {
    assert.ok(MyElement.parts);
    const headerName = `my-element_header`;
    const headerCss = `::part(my-element_header)`;
    const headerDef = `[part=my-element_header]`;
    assert.equal(String(MyElement.parts.header), headerName);
    assert.equal(MyElement.parts.header.part, headerName);
    assert.equal(String(MyElement.parts.header.css), headerCss);
    assert.equal(String(MyElement.parts.header.def), headerDef);
  });

  test('sets part attributes using part directive with defined parts', () => {
    assert.ok(el.shadowRoot?.querySelector('[part=my-element_header]'));
  });

  test('sets default part styles using `part.def`', () => {
    assert.include(MyElement.styles.toString(), headerSelector);
    assert.equal(getComputedStyleValue(el.header, 'padding-top'), '10px');
  });

  test('sets part styles via `part.css`', async () => {
    class E extends LitElement {
      myEl!: MyElement;
      static override styles = css`
        ${parts.header.css} {
          padding-top: 14px;
        }
      `;
      override render() {
        return html`<my-element></my-element>`;
      }
      override firstUpdated() {
        this.myEl = this.renderRoot.firstElementChild as MyElement;
      }
    }
    customElements.define(generateElementName(), E);
    const c = new E();
    container.appendChild(c);
    await c.updateComplete;
    await c.myEl.partsApplied();
    assert.equal(getComputedStyleValue(c.myEl.header, 'padding-top'), '14px');
  });

  test('`createStyle` makes part styles', () => {
    const style = createStyle`${MyElement.parts.header} { padding-top: 4px}`;
    assert.equal(style.localName, 'style');
    assert.include(style.textContent, '::part(my-element_header)');
  });

  test('sets part properties in containing scope using `createStyle`', () => {
    const shadow = nestShadowEl(container);
    const style = createStyle`${MyElement.parts.header} { padding-top: 6px}`;
    shadow.renderRoot.append(style, el);
    assert.equal(getComputedStyleValue(el.header, 'padding-top'), '6px');
  });

  test('sets exportparts on containing scopes', async () => {
    const s1 = nestShadowEl(container);
    const style = createStyle`
      ${MyElement.parts.header} { padding-top: 8px; }
      ${OtherElement.parts.a} {padding-top: 22px; }`;
    const s2 = nestShadowEl(s1.renderRoot);
    s1.renderRoot.append(style);
    const s3 = nestShadowEl(s2.renderRoot);
    const s4 = nestShadowEl(s3.renderRoot);
    const other = new OtherElement();
    s4.renderRoot.appendChild(el);
    s4.renderRoot.appendChild(other);
    await Promise.all([el.partsApplied(), other.partsApplied()]);
    const myElementParts = Object.values(MyElement.parts).map((p) => String(p));
    const otherElementParts = Object.values(OtherElement.parts).map((p) =>
      String(p)
    );
    const exportParts = [...myElementParts, ...otherElementParts];
    assert.sameMembers(getExports(el), myElementParts);
    assert.sameMembers(getExports(other), otherElementParts);
    assert.sameMembers(getExports(s4), exportParts);
    assert.sameMembers(getExports(s3), exportParts);
    assert.sameMembers(getExports(s2), exportParts);
    assert.isNull(s1.getAttribute('exportparts'));
    assert.equal(getComputedStyleValue(el.header, 'padding-top'), '8px');
    assert.equal(getComputedStyleValue(other.a, 'padding-top'), '22px');
  });

  test('does not set exportparts on elements with closed shadowRoots', async () => {
    const s1 = nestShadowEl(container);
    const style = createStyle`${MyElement.parts.header} { padding-top: 8px}`;
    const s2 = nestShadowEl(s1.renderRoot);
    s1.renderRoot.append(style);
    // closed shadowRoot
    const s3 = nestShadowEl(s2.renderRoot, true);
    const s4 = nestShadowEl(s3.renderRoot);
    s4.renderRoot.appendChild(el);
    await el.partsApplied();
    const exportParts = Object.values(MyElement.parts).map((p) => String(p));
    assert.sameMembers(getExports(el), exportParts);
    assert.isNull(s4.getAttribute('exportparts'));
    assert.isNull(s3.getAttribute('exportparts'));
    assert.isNull(s2.getAttribute('exportparts'));
    assert.isNull(s1.getAttribute('exportparts'));
    // default padding-top is 10px
    assert.equal(getComputedStyleValue(el.header, 'padding-top'), '10px');
  });

  test('`createStyle` can apply part styling in main document', () => {
    const s = document.head.appendChild(
      createStyle`${MyElement.parts.header} { padding-top: 8px}`
    );
    assert.ok(s);
    assert.equal(getComputedStyleValue(el.header, 'padding-top'), '8px');
    s.remove();
  });
});
