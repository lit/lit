/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, query} from 'lit/decorators.js';
import {getComputedStyleValue, generateElementName} from './test-helpers';
import {assert} from '@esm-bundle/chai';
import {PartsMixin} from '../mixin.js';
import {partStyle, defineParts, getPartsList, getPartString} from '../parts.js';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  LitElement.disableWarning?.('change-in-update');
}

suite('Parts', () => {
  let container: HTMLElement;

  const headerPart = getPartString('MyElement_header');
  const headerSelector = `[part~=${headerPart}]`;

  @customElement('my-element')
  class MyElement extends PartsMixin(LitElement) {
    static parts = defineParts(
      ['header', 'main', 'footer', 'all'],
      MyElement.name
    );
    static override styles = css`
      :host {
        display: block;
        margin: 2px;
        padding: 2px;
        border: 1px solid black;
      }

      ${MyElement.parts.header.def} {
        padding-left: 10px;
      }
    `;
    @query(MyElement.parts.header.def.toString())
    header!: HTMLDivElement;

    @query(MyElement.parts.footer.def.toString())
    footer!: HTMLDivElement;

    override render() {
      const parts = MyElement.parts;
      return html`
        <div>${this.localName} <slot></slot></div>
        <div ${parts.header.attr} ${parts.all.attr}>H</div>
        <div ${parts.main.attr} ${parts.all.attr}>M</div>
        <div ${parts.footer.attr} ${parts.all.attr}>F</div>
      `;
    }
  }

  @customElement('other-element')
  class OtherElement extends PartsMixin(LitElement) {
    static parts = defineParts(['a', 'b', 'c'], OtherElement.name);

    @query(OtherElement.parts.a.def.toString())
    a!: HTMLDivElement;

    override render() {
      const parts = OtherElement.parts;
      return html`
        <div ${parts.a.attr}>A</div>
        <div ${parts.b.attr}>B</div>
        <div ${parts.c.attr}>C</div>
      `;
    }
  }

  @customElement('export-one')
  class Export1 extends PartsMixin(LitElement) {
    static parts = defineParts(
      [
        ['first', MyElement.parts],
        ['second', MyElement.parts],
      ],
      Export1.name
    );

    static override styles = css`
      :host {
        display: block;
        margin: 2px;
        padding: 2px;
        border: 1px solid darkgray;
      }
    `;

    @query('#f')
    first!: MyElement;

    @query('#s')
    second!: MyElement;

    override render() {
      const parts = Export1.parts;
      return html`
        <div>${this.localName} <slot></slot></div>
        <my-element id="f" ${parts.first.attr}>F</my-element>
        <my-element id="s" ${parts.second.attr}>S</my-element>
      `;
    }
  }

  @customElement('export-two')
  class Export2 extends PartsMixin(LitElement) {
    static parts = defineParts(
      [
        ['uno', Export1.parts],
        ['dos', Export1.parts],
      ],
      Export2.name
    );

    static override styles = css`
      :host {
        display: block;
        margin: 2px;
        padding: 2px;
        border: 1px solid gray;
      }
    `;

    @query('#u')
    uno!: Export1;

    @query('#d')
    dos!: Export1;

    override render() {
      const parts = Export2.parts;
      return html`
        <div>${this.localName} <slot></slot></div>
        <export-one id="u" ${parts.uno.attr}>U</export-one>
        <export-one id="d" ${parts.dos.attr}>D</export-one>
      `;
    }
  }

  @customElement('export-three')
  class Export3 extends PartsMixin(LitElement) {
    static parts = defineParts(
      [
        ['un', Export2.parts],
        ['deux', Export2.parts],
      ],
      Export3.name
    );

    @query('#u')
    un!: Export2;

    @query('#d')
    deux!: Export2;

    override render() {
      const parts = Export3.parts;
      return html`
        <div>${this.localName} <slot></slot></div>
        <export-two id="u" ${parts.un.attr}></export-two>
        <export-two id="d" ${parts.deux.attr}></export-two>
      `;
    }
  }

  class ShadowElement extends HTMLElement {
    renderRoot: ShadowRoot;
    constructor() {
      super();
      const mode = this.hasAttribute('closed') ? 'closed' : 'open';
      this.renderRoot = this.attachShadow({mode});
    }
  }
  customElements.define('shadow-el', ShadowElement);

  let id = 0;

  const nestShadowEl = (n: Element | ShadowRoot, closed = false) => {
    n.innerHTML = `<shadow-el id="s${++id}" ${
      closed ? 'closed' : ''
    }></shadow-el>`;
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
    const headerCss = `::part(${headerPart})`;
    const headerDef = `[part~=${headerPart}]`;
    assert.equal(String(MyElement.parts.header), headerPart);
    assert.equal(MyElement.parts.header.part, headerPart);
    assert.equal(String(MyElement.parts.header.css), headerCss);
    assert.equal(String(MyElement.parts.header.def), headerDef);
  });

  test('sets part attributes using part.attr directive with defined parts', () => {
    assert.ok(el.shadowRoot?.querySelector(`[part~=${headerPart}]`));
  });

  test('sets default part styles using `part.def`', () => {
    assert.include(MyElement.styles.toString(), headerSelector);
    assert.equal(getComputedStyleValue(el.header, 'padding-left'), '10px');
  });

  test('sets part styles via `part.css`', async () => {
    class E extends LitElement {
      myEl!: MyElement;
      static override styles = css`
        ${MyElement.parts.header.css} {
          padding-left: 14px;
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
    assert.equal(getComputedStyleValue(c.myEl.header, 'padding-left'), '14px');
  });

  test('`partStyle` makes part styles', () => {
    const style = partStyle`${MyElement.parts.header} { padding-left: 4px}`;
    assert.equal(style.localName, 'style');
    assert.include(style.textContent, `::part(${headerPart})`);
  });

  test('sets part properties in containing scope using `partStyle`', () => {
    const shadow = nestShadowEl(container);
    const style = partStyle`${MyElement.parts.header} { padding-left: 6px}`;
    shadow.renderRoot.append(style, el);
    assert.equal(getComputedStyleValue(el.header, 'padding-left'), '6px');
  });

  test('sets exportparts on containing scopes', async () => {
    const s1 = nestShadowEl(container);
    const style = partStyle`
      ${MyElement.parts.header} { padding-left: 8px; }
      ${OtherElement.parts.a} {padding-left: 22px; }`;
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
    assert.equal(getComputedStyleValue(el.header, 'padding-left'), '8px');
    assert.equal(getComputedStyleValue(other.a, 'padding-left'), '22px');
  });

  test('does not set exportparts on elements with closed shadowRoots', async () => {
    const s1 = nestShadowEl(container);
    const style = partStyle`${MyElement.parts.header} { padding-left: 8px}`;
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
    // default padding-left is 10px
    assert.equal(getComputedStyleValue(el.header, 'padding-left'), '10px');
  });

  test('`partStyle` can apply part styling in main document', () => {
    const s = document.head.appendChild(
      partStyle`${MyElement.parts.header} { padding-left: 8px}`
    );
    assert.ok(s);
    assert.equal(getComputedStyleValue(el.header, 'padding-left'), '8px');
    s.remove();
  });

  test('can export targeted parts', async () => {
    const s1 = nestShadowEl(container);
    const style = partStyle`
      ${MyElement.parts.header} { padding-left: 18px; }
      ${Export1.parts.first.$.header} {padding-left: 24px; }
      ${Export1.parts.second.$.footer} {padding-left: 28px; }`;
    const s2 = nestShadowEl(s1.renderRoot);
    s1.renderRoot.append(style);
    const s3 = nestShadowEl(s2.renderRoot);
    const s4 = nestShadowEl(s3.renderRoot);
    const e1 = new Export1();
    s4.renderRoot.appendChild(e1);
    await e1.partsApplied();
    const e1Parts = getPartsList(Export1.parts);
    const exportParts = e1Parts;
    assert.includeMembers(getExports(e1), exportParts);
    assert.includeMembers(getExports(s4), exportParts);
    assert.includeMembers(getExports(s3), exportParts);
    assert.includeMembers(getExports(s2), exportParts);
    assert.isNull(s1.getAttribute('exportparts'));
    assert.equal(
      getComputedStyleValue(e1.first.header, 'padding-left'),
      '24px'
    );
    assert.equal(
      getComputedStyleValue(e1.second.header, 'padding-left'),
      '18px'
    );
    assert.equal(
      getComputedStyleValue(e1.second.footer, 'padding-left'),
      '28px'
    );
  });

  test('can export nested targeted parts', async () => {
    const s1 = nestShadowEl(container);
    const style = partStyle`
      ${MyElement.parts.header} { padding-left: 18px; }
      ${Export2.parts.uno.$.first.$.header} {padding-left: 24px; }
      ${MyElement.parts.footer} {padding-left: 28px; }`;
    const s2 = nestShadowEl(s1.renderRoot);
    s1.renderRoot.append(style);
    const s3 = nestShadowEl(s2.renderRoot);
    const s4 = nestShadowEl(s3.renderRoot);
    const e2 = new Export2();
    s4.renderRoot.appendChild(e2);
    await e2.partsApplied();
    const exportParts = getPartsList(Export2.parts);
    assert.includeMembers(getExports(e2), exportParts);
    assert.includeMembers(getExports(s4), exportParts);
    assert.includeMembers(getExports(s3), exportParts);
    assert.includeMembers(getExports(s2), exportParts);
    assert.isNull(s1.getAttribute('exportparts'));
    assert.equal(
      getComputedStyleValue(e2.uno.first.header, 'padding-left'),
      '24px'
    );
    assert.equal(
      getComputedStyleValue(e2.uno.second.header, 'padding-left'),
      '18px'
    );
    assert.equal(
      getComputedStyleValue(e2.dos.second.footer, 'padding-left'),
      '28px'
    );
  });

  test('can export more nested targeted parts', async () => {
    const s1 = nestShadowEl(container);
    const style = partStyle`
      ${MyElement.parts.header} { padding-left: 18px; }
      ${Export3.parts.un.$.uno.$.first.$.header} {padding-left: 24px; }
      ${Export3.parts.deux.$.dos.$.second.$.footer} {padding-left: 28px; }`;
    const s2 = nestShadowEl(s1.renderRoot);
    s1.renderRoot.append(style);
    const s3 = nestShadowEl(s2.renderRoot);
    const s4 = nestShadowEl(s3.renderRoot);
    const e3 = new Export3();
    s4.renderRoot.appendChild(e3);
    await e3.partsApplied();
    const exportParts = getPartsList(Export3.parts);
    assert.includeMembers(getExports(e3), exportParts);
    assert.includeMembers(getExports(s4), exportParts);
    assert.includeMembers(getExports(s3), exportParts);
    assert.includeMembers(getExports(s2), exportParts);
    assert.isNull(s1.getAttribute('exportparts'));
    assert.equal(
      getComputedStyleValue(e3.un.uno.first.header, 'padding-left'),
      '24px'
    );
    assert.equal(
      getComputedStyleValue(e3.un.uno.second.header, 'padding-left'),
      '18px'
    );
    assert.equal(
      getComputedStyleValue(e3.deux.dos.second.footer, 'padding-left'),
      '28px'
    );
  });
});
