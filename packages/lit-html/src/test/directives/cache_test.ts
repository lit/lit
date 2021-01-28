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

import {html, render} from '../../lit-html.js';
import {cache} from '../../directives/cache.js';
import {stripExpressionComments} from '../test-utils/strip-markers.js';
import {assert} from '@esm-bundle/chai';
import {
  directive,
  DisconnectableDirective,
} from '../../disconnectable-directive.js';

suite('cache directive', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('caches templates', () => {
    const renderCached = (condition: any, v: string) =>
      render(
        html`${cache(
          condition ? html`<div v=${v}></div>` : html`<span v=${v}></span>`
        )}`,
        container
      );

    renderCached(true, 'A');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="A"></div>'
    );
    const element1 = container.firstElementChild;

    renderCached(false, 'B');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<span v="B"></span>'
    );
    const element2 = container.firstElementChild;

    assert.notStrictEqual(element1, element2);

    renderCached(true, 'C');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="C"></div>'
    );
    assert.strictEqual(container.firstElementChild, element1);

    renderCached(false, 'D');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<span v="D"></span>'
    );
    assert.strictEqual(container.firstElementChild, element2);
  });

  test('renders non-TemplateResults', () => {
    render(html`${cache('abc')}`, container);
    assert.equal(stripExpressionComments(container.innerHTML), 'abc');
  });

  test('caches templates when switching against non-TemplateResults', () => {
    const renderCached = (condition: any, v: string) =>
      render(
        html`${cache(condition ? html`<div v=${v}></div>` : v)}`,
        container
      );

    renderCached(true, 'A');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="A"></div>'
    );
    const element1 = container.firstElementChild;

    renderCached(false, 'B');
    assert.equal(stripExpressionComments(container.innerHTML), 'B');

    renderCached(true, 'C');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="C"></div>'
    );
    assert.strictEqual(container.firstElementChild, element1);

    renderCached(false, 'D');
    assert.equal(stripExpressionComments(container.innerHTML), 'D');
  });

  test('caches templates when switching against TemplateResult and undefined values', () => {
    const renderCached = (v: unknown) =>
      render(html`<div>${cache(v)}</div>`, container);

    renderCached(html`A`);
    assert.equal(stripExpressionComments(container.innerHTML), '<div>A</div>');

    renderCached(undefined);
    assert.equal(stripExpressionComments(container.innerHTML), '<div></div>');

    renderCached(html`B`);
    assert.equal(stripExpressionComments(container.innerHTML), '<div>B</div>');
  });

  test('cache can be dynamic', () => {
    const renderMaybeCached = (condition: any, v: string) =>
      render(
        html`${condition ? cache(html`<div v=${v}></div>`) : v}`,
        container
      );

    renderMaybeCached(true, 'A');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="A"></div>'
    );

    renderMaybeCached(false, 'B');
    assert.equal(stripExpressionComments(container.innerHTML), 'B');

    renderMaybeCached(true, 'C');
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div v="C"></div>'
    );

    renderMaybeCached(false, 'D');
    assert.equal(stripExpressionComments(container.innerHTML), 'D');
  });

  test('async directives disconnet/reconnect when moved in/out of cache', () => {
    const disconnectable = directive(
      class extends DisconnectableDirective {
        log: string[] | undefined;
        id: string | undefined;
        render(log: string[], id: string) {
          this.log = log;
          this.id = id;
          this.log.push(`render-${this.id}`);
          return id;
        }
        disconnected() {
          this.log!.push(`disconnected-${this.id}`);
        }
        reconnected() {
          this.log!.push(`reconnected-${this.id}`);
        }
      }
    );
    const renderCached = (log: string[], condition: boolean) =>
      render(
        html`<div>${cache(
          condition
            ? html`<div>${disconnectable(log, 'a')}</div>`
            : html`<span>${disconnectable(log, 'b')}</span>`
        )}</div>`,
        container
      );
    const log: string[] = [];

    renderCached(log, true);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div><div>a</div></div>'
    );
    assert.deepEqual(log, ['render-a']);

    log.length = 0;
    renderCached(log, false);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div><span>b</span></div>'
    );
    assert.deepEqual(log, ['disconnected-a', 'render-b']);

    log.length = 0;
    renderCached(log, true);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div><div>a</div></div>'
    );
    assert.deepEqual(log, ['disconnected-b', 'reconnected-a', 'render-a']);

    log.length = 0;
    renderCached(log, false);
    assert.equal(
      stripExpressionComments(container.innerHTML),
      '<div><span>b</span></div>'
    );
    assert.deepEqual(log, ['disconnected-a', 'reconnected-b', 'render-b']);
  });
});
