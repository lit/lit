/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import 'lit-html/polyfill-support.js';
import {html, render as litRender} from 'lit-html';
import {ref, createRef} from 'lit-html/directives/ref.js';
import {repeat} from 'lit-html/directives/repeat.js';
import {cache} from 'lit-html/directives/cache.js';
import {assert} from '@esm-bundle/chai';
import {renderShadowRoot, wrap, shadowRoot} from '../test-utils/shadow-root.js';
import {html as staticHtml, unsafeStatic} from 'lit-html/static.js';

import '../lit-html_test.js';
// selected directive tests
import '../directives/class-map_test.js';
import '../directives/style-map_test.js';
import '../directives/live_test.js';
import '../directives/ref_test.js';
import '../directives/repeat_test.js';
import '../directives/template-content_test.js';
import '../directives/unsafe-html_test.js';

suite('polyfill-support rendering', () => {
  test('style elements apply in shadowRoots', () => {
    const container = document.createElement('scope-1');
    wrap(document.body).appendChild(container);
    (wrap(container) as Element).attachShadow({mode: 'open'});
    const result = html`
      <style>
        div {
          border: 2px solid blue;
        }
      </style>
      <div>Testing...</div>
    `;
    renderShadowRoot(result, container);
    const div = shadowRoot(container)!.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '2px'
    );
    wrap(document.body).removeChild(container);
  });

  test('style elements apply in shadowRoots in nested templates', () => {
    const container = document.createElement('scope-2');
    wrap(document.body).appendChild(container);
    const result = html`
      <style>
        div {
          border: 4px solid orange;
        }
      </style>
      <div>Testing...</div>
      ${html`
        <style>
          span {
            border: 5px solid tomato;
          }
        </style>
        <span>Testing...</span>
      `}
    `;
    renderShadowRoot(result, container);
    const div = shadowRoot(container)!.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '4px'
    );
    const span = shadowRoot(container)!.querySelector('span');
    assert.equal(
      getComputedStyle(span!).getPropertyValue('border-top-width').trim(),
      '5px'
    );
    // all styles are removed
    const styles = shadowRoot(container)!.querySelectorAll('style');
    // if ShadyDOM is in use, all styles should be removed from the template.
    if (window.ShadyDOM?.inUse) {
      assert.equal(styles.length, 0);
    }
    wrap(document.body).removeChild(container);
  });

  test('late added styles are retained and not scoped', () => {
    const container = document.createElement('scope-late');
    wrap(document.body).appendChild(container);
    const getResult = (includeLate = false) => html`
      <style>
        div {
          border: 4px solid orange;
        }
      </style>
      <div>Testing...</div>
      ${
        includeLate
          ? html`<style>div { border: 5px solid tomato; }</style>late`
          : ''
      }
    `;
    renderShadowRoot(getResult(), container);
    const div = shadowRoot(container)!.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '4px'
    );
    renderShadowRoot(getResult(true), container);
    // The late style applies but the rule has lower precedence so the the
    // correctly scoped style still rules.
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '4px'
    );
    // if ShadyDOM is in use, the late added style should leak
    if (window.ShadyDOM?.inUse) {
      // late added styles are retained
      const styles = shadowRoot(container)!.querySelectorAll('style');
      assert.equal(styles.length, 1);
      const d = document.createElement('div');
      document.body.appendChild(d);
      assert.equal(
        getComputedStyle(d).getPropertyValue('border-top-width').trim(),
        '5px'
      );
      document.body.removeChild(d);
    }
    wrap(document.body).removeChild(container);
  });

  test('results render to multiple containers', () => {
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    wrap(document.body).appendChild(container1);
    wrap(document.body).appendChild(container2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getResult = (data: any) => html`${data.a}-${data.b}-${data.c}`;
    renderShadowRoot(getResult({a: 1, b: 2, c: 3}), container1);
    renderShadowRoot(getResult({a: 4, b: 5, c: 6}), container2);
    assert.equal(shadowRoot(container1)!.textContent, '1-2-3');
    assert.equal(shadowRoot(container2)!.textContent, '4-5-6');
    renderShadowRoot(getResult({a: 11, b: 22, c: 33}), container1);
    renderShadowRoot(getResult({a: 44, b: 55, c: 66}), container2);
    assert.equal(shadowRoot(container1)!.textContent, '11-22-33');
    assert.equal(shadowRoot(container2)!.textContent, '44-55-66');
    wrap(document.body).removeChild(container1);
    wrap(document.body).removeChild(container2);
  });

  test('multiple renders re-use rendered DOM', () => {
    const container = document.createElement('scope-re-use');
    wrap(document.body).appendChild(container);
    const renderTemplate = (a: string) => {
      const result = html` <div id="a">${a}</div> `;
      renderShadowRoot(result, container);
    };
    renderTemplate('a');
    const renderedNode = shadowRoot(container)!.querySelector('#a');
    renderTemplate('b');
    assert.equal(shadowRoot(container)!.querySelector('#a'), renderedNode);
    wrap(document.body).removeChild(container);
  });

  test('styles with css custom properties render', () => {
    const container = document.createElement('scope-4');
    wrap(document.body).appendChild(container);
    const result = html`
      <style>
        :host {
          --border: 2px solid orange;
        }
        div {
          border: var(--border);
        }
      </style>
      <div>Testing...</div>
    `;
    renderShadowRoot(result, container);
    if (window.ShadyCSS) {
      window.ShadyCSS.styleElement(container);
    }
    const div = shadowRoot(container)!.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '2px'
    );
    wrap(document.body).removeChild(container);
  });

  test('styles with css custom properties flow to nested shadowRoots', async () => {
    const shadowContent = html`
      <style>
        :host {
          display: block;
          border: var(--border);
        }
      </style>
      <div>Testing...</div>
    `;

    const container = document.createElement('scope-4a');
    wrap(document.body).appendChild(container);
    const result = html`
      <style>
        :host {
          --border: 2px solid orange;
        }
      </style>
      <scope-4a-sub></scope-4a-sub>
    `;
    renderShadowRoot(result, container);
    if (window.ShadyCSS) {
      window.ShadyCSS.styleElement(container);
    }
    const e = shadowRoot(container)!.querySelector('scope-4a-sub')!;
    renderShadowRoot(shadowContent, e);
    if (window.ShadyCSS) {
      window.ShadyCSS.styleElement(e as HTMLElement);
    }
    assert.equal(
      getComputedStyle(e).getPropertyValue('border-top-width').trim(),
      '2px'
    );
    wrap(document.body).removeChild(container);
  });

  test('styles with css custom properties flow to multiple instances of nested shadowRoots', async () => {
    const nestedContent = html`
      <style>
        :host {
          display: block;
          border: var(--border);
        }
      </style>
      <div>Testing...</div>
    `;

    const container = document.createElement('scope-4b');
    wrap(document.body).appendChild(container);
    renderShadowRoot(
      html`
        <style>
          :host {
            --border: 2px solid orange;
          }
        </style>
        <scope-4b-sub></scope-4b-sub>
        <scope-4b-sub></scope-4b-sub>
      `,
      container
    );
    const elements = shadowRoot(container)!.querySelectorAll('scope-4b-sub');
    renderShadowRoot(nestedContent, elements[0]);
    if (window.ShadyCSS) {
      window.ShadyCSS.styleSubtree(elements[0] as HTMLElement);
    }
    renderShadowRoot(nestedContent, elements[1]);
    if (window.ShadyCSS) {
      window.ShadyCSS.styleSubtree(elements[1] as HTMLElement);
    }
    assert.equal(
      getComputedStyle(elements[0]).getPropertyValue('border-top-width').trim(),
      '2px'
    );
    assert.equal(
      getComputedStyle(elements[1]).getPropertyValue('border-top-width').trim(),
      '2px'
    );
    wrap(document.body).removeChild(container);
  });

  test('parts around styles with parts render/update', () => {
    const container = document.createElement('scope-3a');
    wrap(document.body).appendChild(container);
    const renderTemplate = (a: string, b: string, c: string) => {
      const result = html`<style></style>
        <div id="a">${a}</div>
        <style>
          div {
            border: 1px solid black;
          }
        </style>
        <div id="b">${b}</div>
        <style></style>
        <div id="c">${c}</div>
        <style></style> `;
      renderShadowRoot(result, container);
    };
    renderTemplate('a', 'b', 'c');
    const root = shadowRoot(container)!;
    assert.equal(root.querySelector('#a')!.textContent, `a`);
    assert.equal(root.querySelector('#b')!.textContent, `b`);
    assert.equal(root.querySelector('#c')!.textContent, `c`);
    const div = root.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '1px'
    );
    renderTemplate('a1', 'b1', 'c1');
    assert.equal(root.querySelector('#a')!.textContent, `a1`);
    assert.equal(root.querySelector('#b')!.textContent, `b1`);
    assert.equal(root.querySelector('#c')!.textContent, `c1`);
    // Style parts do not update.
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '1px'
    );
    wrap(document.body).removeChild(container);
  });

  test('parts around styles with parts render/update when stamped into multiple containers', () => {
    const container = document.createElement('scope-3b');
    wrap(document.body).appendChild(container);
    const renderTemplate = (
      a: string,
      b: string,
      c: string,
      host = container
    ) => {
      const result = html`<style></style>
        <div id="a">${a}</div>
        <style>
          div {
            border: 1px solid black;
          }
        </style>
        <div id="b">${b}</div>
        <style></style>
        <div id="c">${c}</div>
        <style></style> `;
      renderShadowRoot(result, host);
    };
    // create a dummy element first
    renderTemplate('', '', '', document.createElement('scope-3b'));
    // then test the 2nd element made for this scope
    renderTemplate('a', 'b', 'c');
    const root = shadowRoot(container)!;
    assert.equal(root.querySelector('#a')!.textContent, `a`);
    assert.equal(root.querySelector('#b')!.textContent, `b`);
    assert.equal(root.querySelector('#c')!.textContent, `c`);
    const div = root.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '1px'
    );
    renderTemplate('a1', 'b1', 'c1');
    assert.equal(root.querySelector('#a')!.textContent, `a1`);
    assert.equal(root.querySelector('#b')!.textContent, `b1`);
    assert.equal(root.querySelector('#c')!.textContent, `c1`);
    // Style parts do not update.
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '1px'
    );
    wrap(document.body).removeChild(container);
  });

  test('empty styles are ok', function () {
    const container1 = document.createElement('scope-empty-style');
    wrap(document.body).appendChild(container1);
    const renderTemplate = (foo: string, container: Element) => {
      const result = html`<div id="a">${foo}</div>
        <style></style>
        <div id="b">${foo}</div>`;
      renderShadowRoot(result, container);
    };
    renderTemplate('foo', container1);
    assert.equal(
      shadowRoot(container1)!.querySelector('#a')!.textContent,
      `foo`
    );
    assert.equal(
      shadowRoot(container1)!.querySelector('#b')!.textContent,
      `foo`
    );
    const container2 = document.createElement('scope-empty-style');
    wrap(document.body).appendChild(container2);
    renderTemplate('bar', container2);
    assert.equal(
      shadowRoot(container2)!.querySelector('#a')!.textContent,
      `bar`
    );
    assert.equal(
      shadowRoot(container2)!.querySelector('#b')!.textContent,
      `bar`
    );
    wrap(document.body).removeChild(container1);
    wrap(document.body).removeChild(container2);
  });

  test('static part values render into styles once per scope', function () {
    if (typeof window.ShadyDOM === 'undefined' || !window.ShadyDOM.inUse) {
      this.skip();
      return;
    }
    const container = document.createElement('scope-3');
    wrap(document.body).appendChild(container);
    const renderTemplate = (border: string) => {
      const result = staticHtml`
        <style>
          div {
            border: ${unsafeStatic(border)};
          }
        </style>
        <div>Testing...</div>
      `;
      renderShadowRoot(result, container);
    };
    renderTemplate('1px solid black');
    let div = shadowRoot(container)!.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '1px'
    );
    renderTemplate('2px solid black');
    div = shadowRoot(container)!.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '1px'
    );
    wrap(document.body).removeChild(container);
  });

  test('parts around <slot> elements', () => {
    const el = document.createElement('slot-host');
    wrap(document.body).appendChild(el);
    const render = (title: string) => {
      renderShadowRoot(
        html`<slot name="before"> </slot>${title}<slot name="after"></slot>`,
        el
      );
    };
    render('foo');
    assert.equal(shadowRoot(el)?.textContent, ' foo');
    render('bar');
    assert.equal(shadowRoot(el)?.textContent, ' bar');
    render('');
    assert.equal(shadowRoot(el)?.textContent, ' ');
    render('zot');
    assert.equal(shadowRoot(el)?.textContent, ' zot');
    const c1 = document.createElement('div');
    (wrap(c1) as Element).setAttribute('slot', 'before');
    wrap(el).appendChild(c1);
    assert.equal(shadowRoot(el)?.textContent, ' zot');
    render('c1');
    assert.equal(shadowRoot(el)?.textContent, ' c1');
    const c2 = document.createElement('div');
    (wrap(c2) as Element).setAttribute('slot', 'after');
    wrap(el).appendChild(c2);
    render('c1c2');
    assert.equal(shadowRoot(el)?.textContent, ' c1c2');
    wrap(el).textContent = '';
    assert.equal(shadowRoot(el)?.textContent, ' c1c2');
    wrap(document.body).removeChild(el);
  });

  test('`repeat` in shadowRoot', () => {
    const el = document.createElement('div');
    const listRefs: Array<{value?: Element | undefined}> = [];
    wrap(document.body).appendChild(el);
    const render = (data: number[]) => {
      listRefs.length = 0;
      data.forEach((_i: number) => listRefs.push(createRef()));
      const list = repeat(
        data,
        (i) => i,
        // prettier-ignore
        (i: number) => html`<span ${ref(listRefs[i])}>${i}</span>`
      );
      renderShadowRoot(html`<span>[</span>${list}<span>]</span>`, el);
    };
    render([0, 1, 2]);
    assert.equal(shadowRoot(el)?.textContent, '[012]');
    render([]);
    assert.equal(shadowRoot(el)?.textContent, '[]');
    render([4, 5, 6, 7]);
    assert.equal(shadowRoot(el)?.textContent, '[4567]');
    wrap(document.body).removeChild(el);
  });

  test('`repeat` in slots', () => {
    const el = document.createElement('div');
    const beforeSlotRef = createRef();
    const afterSlotRef = createRef();
    const shadowHostRef = createRef();
    const listRefs: Array<{value?: Element | undefined}> = [];
    wrap(document.body).appendChild(el);
    const render = (title: string, data: string[]) => {
      listRefs.length = 0;
      data.forEach((_i: string) => listRefs.push(createRef()));
      const list = repeat(
        data,
        (i) => i,
        // prettier-ignore
        (s: string, i: number) => html`<span slot="${s}" ${ref(listRefs[i])}>item: ${i}</span>`
      );
      litRender(html`<div ${ref(shadowHostRef)}>${list}</div>`, el);
      renderShadowRoot(
        html`<slot name="before" ${ref(
          beforeSlotRef
        )}></slot> ${title}<slot name="after" ${ref(afterSlotRef)}></slot>`,
        shadowHostRef.value!
      );
    };
    render('foo', ['before', 'after', 'nope']);
    assert.equal(shadowRoot(shadowHostRef.value!)?.textContent, ' foo');
    assert.deepEqual(
      (wrap(beforeSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      [listRefs[0].value!]
    );
    assert.deepEqual(
      (wrap(afterSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      [listRefs[1].value!]
    );
    render('bar', ['after', 'after', 'nope', 'before', 'nope']);
    assert.equal(shadowRoot(shadowHostRef.value!)?.textContent, ' bar');
    assert.deepEqual(
      (wrap(beforeSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      [listRefs[3].value!]
    );
    assert.deepEqual(
      (wrap(afterSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      [listRefs[0].value!, listRefs[1].value!]
    );
    render('zot', []);
    assert.equal(shadowRoot(shadowHostRef.value!)?.textContent, ' zot');
    assert.deepEqual(
      (wrap(beforeSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );
    assert.deepEqual(
      (wrap(afterSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );
    wrap(document.body).removeChild(el);
  });

  test('`cache` in shadowRoot', () => {
    const el = document.createElement('div');
    const aRef = createRef();
    const aTemplate = html`<span ${ref(aRef)}>A</span>`;
    const bRef = createRef();
    const bTemplate = html`<span ${ref(bRef)}>B</span>`;
    wrap(document.body).appendChild(el);
    const render = (value?: unknown) => {
      renderShadowRoot(html`<span>[</span>${cache(value)}<span>]</span>`, el);
    };
    //
    render(aTemplate);
    assert.equal(shadowRoot(el)?.textContent, '[A]');
    const aNode = aRef.value;
    render();
    assert.equal(shadowRoot(el)?.textContent, '[]');
    render(aTemplate);
    assert.equal(shadowRoot(el)?.textContent, '[A]');
    assert.equal(aNode, aRef.value);
    render(bTemplate);
    assert.equal(shadowRoot(el)?.textContent, '[B]');
    const bNode = bRef.value;
    render(aTemplate);
    assert.equal(shadowRoot(el)?.textContent, '[A]');
    assert.equal(aNode, aRef.value);
    render(bTemplate);
    assert.equal(shadowRoot(el)?.textContent, '[B]');
    assert.equal(bNode, bRef.value);
    wrap(document.body).removeChild(el);
  });

  test('`cache` in slots', () => {
    const el = document.createElement('div');
    const beforeSlotRef = createRef();
    const afterSlotRef = createRef();
    const shadowHostRef = createRef();
    const aRef = createRef();
    const aTemplate = (slot: string) =>
      html`<span slot=${slot} ${ref(aRef)}>A</span>`;
    const bRef = createRef();
    const bTemplate = (slot: string) =>
      html`<span slot=${slot} ${ref(bRef)}>B</span>`;
    wrap(document.body).appendChild(el);
    const render = (value?: unknown) => {
      litRender(html`<div ${ref(shadowHostRef)}>${cache(value)}</div>`, el);
      renderShadowRoot(
        html`<slot name="before" ${ref(
          beforeSlotRef
        )}></slot>|<slot name="after" ${ref(afterSlotRef)}></slot>`,
        shadowHostRef.value!
      );
    };
    //
    render(aTemplate('before'));
    assert.equal(wrap(shadowHostRef.value!).textContent, 'A');
    const aNode = aRef.value!;
    assert.deepEqual(
      (wrap(beforeSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      [aNode]
    );
    assert.deepEqual(
      (wrap(afterSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );

    render();
    assert.equal(wrap(shadowHostRef.value!).textContent, '');
    assert.deepEqual(
      (wrap(beforeSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );
    assert.deepEqual(
      (wrap(afterSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );
    render(aTemplate('after'));
    assert.equal(wrap(shadowHostRef.value!).textContent, 'A');
    assert.deepEqual(
      (wrap(beforeSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );
    assert.deepEqual(
      (wrap(afterSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      [aNode]
    );
    assert.equal(aNode, aRef.value);
    render(bTemplate('before'));
    assert.equal(wrap(shadowHostRef.value!).textContent, 'B');
    const bNode = bRef.value!;
    assert.deepEqual(
      (wrap(beforeSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      [bNode]
    );
    assert.deepEqual(
      (wrap(afterSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );
    render(aTemplate(''));
    assert.equal(wrap(shadowHostRef.value!).textContent, 'A');
    assert.equal(aNode, aRef.value);
    assert.deepEqual(
      (wrap(beforeSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );
    assert.deepEqual(
      (wrap(afterSlotRef.value!) as HTMLSlotElement).assignedNodes(),
      []
    );
    wrap(document.body).removeChild(el);
  });
});
