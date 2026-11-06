/**
 * @license
 * Copyright The Lit Project Contributors.
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, svg, mathml, render, TemplateResult} from 'lit-html';
import {isCompiledTemplateResult} from 'lit-html/directive-helpers.js';
import {assert} from 'chai';

const DEV_MODE = !!globalThis.litIssuedWarnings;
const testAreCompiled = isCompiledTemplateResult(html``);
const suiteIfUncompiled = testAreCompiled ? suite.skip : suite;
const svgNamespace = 'http://www.w3.org/2000/svg';

suiteIfUncompiled('Template namespace warnings', () => {
  let container: HTMLDivElement;
  let warnings: string[];
  let issuedWarnings: typeof globalThis.litIssuedWarnings;
  const consoleWarn = console.warn;

  setup(() => {
    container = document.createElement('div');
    warnings = [];
    issuedWarnings = globalThis.litIssuedWarnings;
    if (DEV_MODE) {
      globalThis.litIssuedWarnings = new Set();
    }
    console.warn = (warning: string) => warnings.push(warning);
  });

  teardown(() => {
    console.warn = consoleWarn;
    globalThis.litIssuedWarnings = issuedWarnings;
  });

  const assertWarning = () => {
    assert.lengthOf(warnings, DEV_MODE ? 1 : 0);
    if (warnings.length > 0) {
      assert.include(warnings[0], 'namespace');
    }
  };

  test('warns once for SVG rendered into HTML', () => {
    const template = () => svg`<a></a>`;
    render(template(), container);
    render(template(), container);
    render(template(), document.createElement('div'));
    assertWarning();
    assert.equal(container.querySelector('a')!.namespaceURI, svgNamespace);
  });

  test('warns for HTML rendered into SVG on the initial render', () => {
    render(html`<svg>${html`<a></a>`}</svg>`, container);
    assertWarning();
    assert.equal(
      container.querySelector('a')!.namespaceURI,
      'http://www.w3.org/1999/xhtml'
    );
  });

  test('warns when a nested part changes template kind', () => {
    const template = (child: TemplateResult) => html`<svg>${child}</svg>`;
    render(template(svg`<a></a>`), container);
    assert.lengthOf(warnings, 0);
    render(template(html`<a></a>`), container);
    assertWarning();
  });

  test('warns for a mismatch inside an iterable', () => {
    render(html`<svg>${[html`<a></a>`]}</svg>`, container);
    assertWarning();
  });

  test('warns for SVG rendered into a shadow root', () => {
    render(svg`<a></a>`, container.attachShadow({mode: 'open'}));
    assertWarning();
  });

  test('warns for SVG children rendered into foreignObject', () => {
    render(
      svg`<a></a>`,
      document.createElementNS(svgNamespace, 'foreignObject')
    );
    assertWarning();
  });

  test('accepts matching HTML and SVG templates', () => {
    render(html`<div>${html`<span></span>`}</div>`, container);
    render(html`<svg>${svg`<circle></circle>`}</svg>`, container);
    render(svg`<circle></circle>`, document.createElementNS(svgNamespace, 'g'));
    assert.lengthOf(warnings, 0);
  });

  for (const tag of ['foreignObject', 'desc', 'title']) {
    test(`accepts HTML inside SVG ${tag}`, () => {
      const parent = document.createElementNS(svgNamespace, tag);
      render(html`<span></span>`, parent);
      assert.lengthOf(warnings, 0);
    });
  }

  test('accepts nested HTML and SVG namespace transitions', () => {
    render(
      html`<svg>
        <foreignObject>
          ${html`<div><svg>${svg`<circle></circle>`}</svg></div>`}
        </foreignObject>
      </svg>`,
      container
    );
    assert.lengthOf(warnings, 0);
  });

  test('accepts a template with an explicit SVG root', () => {
    render(svg`<svg><circle></circle></svg>`, container);
    render(
      html`<svg><circle></circle></svg>`,
      document.createElementNS(svgNamespace, 'g')
    );
    assert.lengthOf(warnings, 0);
  });

  test('accepts namespace-neutral template wrappers', () => {
    render(html`<svg>${html`${svg`<circle></circle>`}`}</svg>`, container);
    assert.lengthOf(warnings, 0);
  });

  test('accepts templates rendered into a document fragment', () => {
    render(html`<div></div>`, document.createDocumentFragment());
    render(svg`<circle></circle>`, document.createDocumentFragment());
    assert.lengthOf(warnings, 0);
  });

  test('does not apply the HTML/SVG warning to MathML', () => {
    render(html`<math>${mathml`<mi>x</mi>`}</math>`, container);
    assert.lengthOf(warnings, 0);
  });
});
