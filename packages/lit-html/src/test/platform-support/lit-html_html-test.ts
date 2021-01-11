/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import '../../platform-support.js';
import {html} from '../../lit-html.js';
import {assert} from '@esm-bundle/chai';
import {renderShadowRoot, wrap, shadowRoot} from '../test-utils/shadow-root.js';

suite('platform-support rendering', () => {
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
      window.ShadyCSS.styleElement(e);
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
      window.ShadyCSS.styleSubtree(elements[0]);
    }
    renderShadowRoot(nestedContent, elements[1]);
    if (window.ShadyCSS) {
      window.ShadyCSS.styleSubtree(elements[1]);
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

  // TODO(sorvell): This will only be supported via static bindings.
  test.skip('part values render into styles once per scope', function () {
    if (typeof window.ShadyDOM === 'undefined' || !window.ShadyDOM.inUse) {
      this.skip();
      return;
    }
    const container = document.createElement('scope-3');
    wrap(document.body).appendChild(container);
    const renderTemplate = (border: string) => {
      const result = html`
        <style>
          div {
            border: ${border};
          }
        </style>
        <div>Testing...</div>
      `;
      renderShadowRoot(result, container);
    };
    renderTemplate('1px solid black');
    const div = shadowRoot(container)!.querySelector('div');
    assert.equal(
      getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
      '1px'
    );
    renderTemplate('2px solid black');
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
});
