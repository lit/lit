/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {templateContent} from 'lit-html/directives/template-content.js';
import {html, render} from 'lit-html';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from '@esm-bundle/chai';

suite('templateContent', () => {
  let container: HTMLElement;
  const template = document.createElement('template');
  template.innerHTML = '<div>aaa</div>';

  setup(() => {
    container = document.createElement('div');
  });

  test('renders a template', () => {
    render(html`<div>${templateContent(template)}</div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><div>aaa</div></div>'
    );
  });

  test('clones a template only once', () => {
    const go = () =>
      render(html`<div>${templateContent(template)}</div>`, container);
    go();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><div>aaa</div></div>'
    );
    const templateDiv = container.querySelector('div > div') as HTMLDivElement;

    go();
    const templateDiv2 = container.querySelector('div > div') as HTMLDivElement;
    assert.equal(templateDiv, templateDiv2);
  });

  test('renders a new template over a previous one', () => {
    const go = (t: HTMLTemplateElement) =>
      render(html`<div>${templateContent(t)}</div>`, container);
    go(template);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><div>aaa</div></div>'
    );

    const newTemplate = document.createElement('template');
    newTemplate.innerHTML = '<span>bbb</span>';
    go(newTemplate);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><span>bbb</span></div>'
    );
  });

  test('re-renders a template over a non-templateContent value', () => {
    const go = (v: unknown) => render(html`<div>${v}</div>`, container);
    go(templateContent(template));
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><div>aaa</div></div>'
    );

    go('ccc');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>ccc</div>');

    go(templateContent(template));
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><div>aaa</div></div>'
    );
  });
});
