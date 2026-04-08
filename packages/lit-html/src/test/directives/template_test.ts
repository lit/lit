/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {template} from 'lit-html/directives/template.js';
import {html, noChange, nothing, render} from 'lit-html';
import {createRef, ref} from 'lit-html/directives/ref.js';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from 'chai';

suite('template', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('renders a template element', () => {
    render(html`<div>${template(html`<p>${'aaa'}</p>`)}</div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><template><p>aaa</p></template></div>'
    );
  });

  test('renders boolean attributes and reflected properties', () => {
    render(
      html`<div>${template(html`<input ?disabled=${true}><div .className=${'x'}></div>`)}</div>`,
      container
    );
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><template><input disabled=""><div class="x"></div></template></div>'
    );
  });

  test('preserves authored empty comments', () => {
    render(
      html`<div>${template(html`<!----><p>${'aaa'}</p>`)}</div>`,
      container
    );
    const templateEl = container.querySelector('template');
    assert.instanceOf(templateEl, HTMLTemplateElement);
    assert.equal(templateEl!.innerHTML, '<!----><p>aaa</p>');
  });

  test('strips marker text from authored comments', () => {
    render(html`<div>${template(html`<!-- a=${'A'}-->`)}</div>`, container);
    const templateEl = container.querySelector('template');
    assert.instanceOf(templateEl, HTMLTemplateElement);
    assert.equal(templateEl!.innerHTML, '<!-- a=-->');
  });

  test('preserves authored marker-like comments', () => {
    render(
      html`<div>${template(
        html`<!--lit-part--><p>${'aaa'}</p><!--lit-node 3-->`
      )}</div>`,
      container
    );
    const templateEl = container.querySelector('template');
    assert.instanceOf(templateEl, HTMLTemplateElement);
    assert.equal(
      templateEl!.innerHTML,
      '<!--lit-part--><p>aaa</p><!--lit-node 3-->'
    );
  });

  test('does not attach event listeners inside template content', () => {
    let clicks = 0;
    render(
      html`<div>${template(
        html`<button @click=${() => clicks++}>ok</button>`
      )}</div>`,
      container
    );
    const templateEl = container.querySelector('template');
    assert.instanceOf(templateEl, HTMLTemplateElement);
    const button = templateEl!.content.querySelector('button');
    assert.instanceOf(button, HTMLButtonElement);
    button!.click();
    assert.equal(clicks, 0);
    assert.equal(templateEl!.innerHTML, '<button>ok</button>');
  });

  test('renders only once for subsequent updates', () => {
    const go = (name: string) =>
      render(html`<div>${template(html`<p>${name}</p>`)}</div>`, container);

    go('first');
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><template><p>first</p></template></div>'
    );

    go('second');
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><template><p>first</p></template></div>'
    );
  });

  test('re-renders over non-template values', () => {
    const go = (v: unknown) => render(html`<div>${v}</div>`, container);

    go(template(html`<p>${'aaa'}</p>`));
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><template><p>aaa</p></template></div>'
    );

    go('bbb');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bbb</div>');

    go(template(html`<p>${'ccc'}</p>`));
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><template><p>ccc</p></template></div>'
    );
  });

  test('passes through sentinel values', () => {
    render(html`<div>${template(nothing)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    render(html`<div>${template(noChange)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('throws for non-template values', () => {
    assert.throws(
      () =>
        render(
          html`<div>${template('not-a-template' as unknown as never)}</div>`,
          container
        ),
      'template() called with a non-TemplateResult value'
    );
  });

  test('ignores element bindings inside template content', () => {
    const hits: string[] = [];
    const spanRef = createRef<HTMLSpanElement>();
    render(
      html`<div>${template(
        html`<button ${ref((el) => hits.push(el?.tagName ?? 'undefined'))}>ok</button><span ${ref(
          spanRef
        )}></span>`
      )}</div>`,
      container
    );
    assert.deepEqual(hits, []);
    assert.isUndefined(spanRef.value);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><template><button>ok</button><span></span></template></div>'
    );
  });

  test('rejects non-clone-stable property bindings', () => {
    assert.throws(
      () =>
        render(
          html`<div>${template(html`<div .foo=${'bar'}></div>`)}</div>`,
          container
        ),
      'template() only supports clone-stable property bindings on native elements. Unsupported binding: .foo on <div>'
    );
  });
});
