/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  html,
  ChildPart,
  render,
  svg,
  TemplateResult,
  CompiledTemplateResult,
  CompiledTemplate,
} from 'lit-html';
import {assert} from '@esm-bundle/chai';
import {stripExpressionComments} from '@lit-labs/testing';
import {
  getDirectiveClass,
  insertPart,
  isDirectiveResult,
  isPrimitive,
  isTemplateResult,
  removePart,
  setChildPartValue,
  TemplateResultType,
  isCompiledTemplateResult,
} from 'lit-html/directive-helpers.js';
import {classMap} from 'lit-html/directives/class-map.js';
import {
  directive,
  Directive,
  AsyncDirective,
} from 'lit-html/async-directive.js';

const branding_tag = (s: TemplateStringsArray) => s;
const _$lit_template_1: CompiledTemplate = {
  h: branding_tag``,
  parts: [],
};

/**
 * Use to check if the file has been compiled with @lit-labs/compiler.
 */
const isTestFileNotCompiled = html``['_$litType$'] === 1;

suite('directive-helpers', () => {
  let container: HTMLDivElement;

  const assertContent = (html: string, root = container) => {
    return assert.equal(stripExpressionComments(root.innerHTML), html);
  };

  setup(() => {
    container = document.createElement('div');
  });

  test('isPrimitive', () => {
    assert.isTrue(isPrimitive(null));
    assert.isTrue(isPrimitive(undefined));
    assert.isTrue(isPrimitive(true));
    assert.isTrue(isPrimitive(1));
    assert.isTrue(isPrimitive('a'));
    assert.isTrue(isPrimitive(Symbol()));

    // Can't polyfill this syntax:
    // assert.isTrue(isPrimitive(1n));

    assert.isFalse(isPrimitive({}));
    assert.isFalse(isPrimitive(() => {}));
  });

  test('isTemplateResult', () => {
    assert.isTrue(isTemplateResult(html``));
    assert.isTrue(isTemplateResult(svg``));
    if (isTestFileNotCompiled) {
      assert.isTrue(isTemplateResult(html``, TemplateResultType.HTML));
    } else {
      // This template was compiled, so `isTemplateResult` with an explicit
      // check for `TemplateResultType.HTML` returns false.
      assert.isFalse(isTemplateResult(html``, TemplateResultType.HTML));
    }
    assert.isTrue(isTemplateResult(svg``, TemplateResultType.SVG));

    assert.isFalse(isTemplateResult(null));
    assert.isFalse(isTemplateResult(undefined));
    assert.isFalse(isTemplateResult({}));
    assert.isFalse(isTemplateResult(html``, TemplateResultType.SVG));
    assert.isFalse(isTemplateResult(svg``, TemplateResultType.HTML));
    assert.isFalse(isTemplateResult(null, TemplateResultType.HTML));
    assert.isFalse(isTemplateResult(undefined, TemplateResultType.HTML));
    assert.isFalse(isTemplateResult({}, TemplateResultType.HTML));

    assert.isTrue(
      isTemplateResult({
        _$litType$: _$lit_template_1,
        values: [],
      })
    );
    assert.isFalse(
      isTemplateResult(
        {
          _$litType$: _$lit_template_1,
          values: [],
        },
        TemplateResultType.HTML
      )
    );
    assert.isFalse(
      isTemplateResult(
        {
          _$litType$: _$lit_template_1,
          values: [],
        },
        TemplateResultType.SVG
      )
    );
  });

  test('isTemplateResult type only test', () => {
    // This test has no runtime checks, and fails at build time if there are
    // type issues.
    function acceptTemplateResult(_v: TemplateResult) {}
    function acceptTemplateOrCompiledTemplateResult(
      _v: TemplateResult | CompiledTemplateResult
    ) {}
    function acceptTemplateResultHtml(
      _v: TemplateResult<typeof TemplateResultType.HTML>
    ) {}
    function acceptTemplateResultSvg(
      _v: TemplateResult<typeof TemplateResultType.SVG>
    ) {}

    const v = html`` as TemplateResult | CompiledTemplateResult;
    if (isTemplateResult(v)) {
      acceptTemplateOrCompiledTemplateResult(v);

      // @ts-expect-error v could be a CompiledTemplateResult
      acceptTemplateResult(v);
    }
    if (isTemplateResult(v, TemplateResultType.HTML)) {
      acceptTemplateResult(v);
      acceptTemplateResultHtml(v);
      // @ts-expect-error v is an html template result
      acceptTemplateResultSvg(v);
    }
    if (isTemplateResult(v, TemplateResultType.SVG)) {
      acceptTemplateResult(v);
      acceptTemplateResultSvg(v);
      // @ts-expect-error v is an svg template result
      acceptTemplateResultHtml(v);
    }
  });

  test('isCompiledTemplateResult', () => {
    assert.isTrue(
      isCompiledTemplateResult({
        _$litType$: _$lit_template_1,
        values: [],
      })
    );

    if (isTestFileNotCompiled) {
      assert.isFalse(isCompiledTemplateResult(html``));
    }
    assert.isFalse(isCompiledTemplateResult(svg``));
    assert.isFalse(isCompiledTemplateResult(null));
    assert.isFalse(isCompiledTemplateResult(undefined));
    assert.isFalse(isCompiledTemplateResult({}));
  });

  test('isDirectiveResult', () => {
    assert.isTrue(isDirectiveResult(classMap({})));

    assert.isFalse(isDirectiveResult(null));
    assert.isFalse(isDirectiveResult(undefined));
    assert.isFalse(isDirectiveResult({}));
  });

  test('getDirectiveClass', () => {
    assert.instanceOf(getDirectiveClass(classMap({}))?.prototype, Directive);
    assert.equal(getDirectiveClass(null), undefined);
    assert.equal(getDirectiveClass(undefined), undefined);
    assert.equal(getDirectiveClass({}), undefined);
  });

  test('insertPart', () => {
    class TestDirective extends Directive {
      render(v: unknown) {
        return v;
      }

      override update(part: ChildPart, [v]: Parameters<this['render']>) {
        // Create two parts and remove the first, then the second to make sure
        // that removing the first doesn't move the second's markers. This
        // fails if the parts accidentally share a marker.
        const childPart2 = insertPart(part, undefined);
        const childPart1 = insertPart(part, undefined, childPart2);
        removePart(childPart1);
        removePart(childPart2);
        return v;
      }
    }
    const testDirective = directive(TestDirective);

    const go = (v: unknown) =>
      render(html`<div>${testDirective(v)}</div>`, container);

    go('A');
    assertContent('<div>A</div>');
  });

  test('insertPart keeps connection state in sync', () => {
    // Directive that tracks/renders connected state
    let connected = false;
    const aDirective = directive(
      class extends AsyncDirective {
        render() {
          connected = this.isConnected;
          return this.isConnected;
        }
        override disconnected() {
          connected = false;
          assert.equal(connected, this.isConnected);
          this.setValue(connected);
        }
        override reconnected() {
          connected = true;
          assert.equal(connected, this.isConnected);
          this.setValue(connected);
        }
      }
    );

    const container1 = container.appendChild(document.createElement('div'));
    const container2 = container.appendChild(document.createElement('div'));

    // Create disconnected root part
    const rootPart1 = render('rootPart1:', container1);
    rootPart1.setConnected(false);

    // Create connected root part
    const rootPart2 = render('rootPart2:', container2);

    // Insert child part into disconnected root part
    const movingPart = insertPart(rootPart1);
    const template = (v: unknown) => html`<p>${v}</p>`;
    setChildPartValue(movingPart, template(aDirective()));

    // Verify child part is not connected
    assertContent('rootPart1:<p>false</p>', container1);
    assertContent('rootPart2:', container2);
    assert.isFalse(connected);

    // Move child part into connected root part
    insertPart(rootPart2, undefined, movingPart);

    // Verify child part is connected
    assertContent('rootPart1:', container1);
    assertContent('rootPart2:<p>true</p>', container2);
    assert.isTrue(connected);

    // Flip connection state of parts
    rootPart1.setConnected(true);
    rootPart2.setConnected(false);

    // Verify child part is not connected
    assertContent('rootPart1:', container1);
    assertContent('rootPart2:<p>false</p>', container2);
    assert.isFalse(connected);

    // Move child part into connected root part
    insertPart(rootPart1, undefined, movingPart);

    // Verify child part is connected
    assertContent('rootPart1:<p>true</p>', container1);
    assertContent('rootPart2:', container2);
    assert.isTrue(connected);
  });
});
