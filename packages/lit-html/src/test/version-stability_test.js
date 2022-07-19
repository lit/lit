/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as litHtml1 from 'lit-html';
import * as directive1 from 'lit-html/directive.js';
import * as asyncDirective1 from 'lit-html/async-directive.js';
import * as repeat1 from 'lit-html/directives/repeat.js';

import * as litHtml2 from 'lit-html/version-stability-build/lit-html.js';
import * as directive2 from 'lit-html/version-stability-build/directive.js';
import * as asyncDirective2 from 'lit-html/version-stability-build/async-directive.js';
import * as repeat2 from 'lit-html/version-stability-build/directives/repeat.js';

import {stripExpressionComments} from 'lit-html/development/test/test-utils/strip-markers.js';
import {assert} from '@esm-bundle/chai';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const version1 = [litHtml1, directive1, asyncDirective1, repeat1];
const version2 = [litHtml2, directive2, asyncDirective2, repeat2];

[
  [version1, version2],
  [version2, version1],
].forEach(
  ([
    [
      {html: htmlA, render: renderA, nothing: nothingA},
      {directive: directiveA, Directive: DirectiveA, PartType: PartTypeA},
      {AsyncDirective: AsyncDirectiveA},
    ],
    [
      {html: htmlB, nothing: nothingB, noChange: noChangeB},
      {directive: directiveB, Directive: DirectiveB, PartType: PartTypeB},
      {AsyncDirective: AsyncDirectiveB},
      {repeat: repeatB},
    ],
  ]) => {
    suite('version-stability', () => {
      let container;

      const dirA = directiveA(
        class extends DirectiveA {
          constructor(partInfo) {
            super(partInfo);
            this.partInfo = partInfo;
          }
          render(v) {
            if (this.partInfo.type !== PartTypeA.ATTRIBUTE) {
              throw new Error('expected PartType.ATTRIBUTE');
            }
            const {tagName, name, strings} = this.partInfo;
            return `[${v}:${tagName}:${name}:${strings.join(':')}]`;
          }
        }
      );

      const dirB = directiveB(
        class extends DirectiveB {
          constructor(partInfo) {
            super(partInfo);
            this.partInfo = partInfo;
          }
          render(v) {
            if (this.partInfo.type !== PartTypeB.ATTRIBUTE) {
              throw new Error('expected PartType.ATTRIBUTE');
            }
            const {tagName, name, strings} = this.partInfo;
            return `[${v}:${tagName}:${name}:${strings.join(':')}]`;
          }
        }
      );

      const passthruB = directiveB(
        class extends DirectiveB {
          render(v) {
            return v;
          }
        }
      );

      const asyncA = directiveA(
        class extends AsyncDirectiveA {
          render(v, cb) {
            this.cb = cb;
            this.cb(true);
            Promise.resolve().then(() => this.setValue(v));
          }
          disconnected() {
            this.cb(false);
          }
          reconnected() {
            this.cb(true);
          }
        }
      );

      const asyncB = directiveB(
        class extends AsyncDirectiveB {
          render(v, cb) {
            this.cb = cb;
            this.cb(true);
            Promise.resolve().then(() => this.setValue(v));
          }
          disconnected() {
            this.cb(false);
          }
          reconnected() {
            this.cb(true);
          }
        }
      );

      setup(() => {
        container = document.createElement('div');
      });

      const assertContent = (expected) => {
        assert.equal(stripExpressionComments(container.innerHTML), expected);
      };

      test('renderA with htmlB', () => {
        renderA(htmlB`<div>${'test'}</div>`, container);
        assertContent('<div>test</div>');
      });

      test('renderA with nothingB and noChangeB', () => {
        const template = (v) => htmlA`<div>${v}</div>`;
        renderA(template('test'), container);
        assertContent('<div>test</div>');
        renderA(template(nothingB), container);
        assertContent('<div></div>');
        renderA(template('test'), container);
        assertContent('<div>test</div>');
        renderA(template(noChangeB), container);
        assertContent('<div>test</div>');
      });

      test('renderA with directiveB', () => {
        renderA(htmlB`<div title="a${dirB('B')}b"></div>`, container);
        assertContent('<div title="a[B:DIV:title:a:b]b"></div>');
      });

      test('renderA with directiveA nested in passthruB', () => {
        renderA(
          htmlB`<div title="a${passthruB(dirA('A'))}b"></div>`,
          container
        );
        assertContent('<div title="a[A:DIV:title:a:b]b"></div>');
      });

      test('renderA with asyncB', async () => {
        let connected = true;
        const cb = (c) => (connected = c);
        const template = (bool) =>
          htmlA`<div>${bool ? asyncB('B', cb) : nothingA}</div>`;
        renderA(template(true), container);
        assertContent('<div></div>');
        assert.isTrue(connected);
        // Wait until directive updates value.
        await nextFrame();
        assertContent('<div>B</div>');
        renderA(template(false), container);
        assert.isFalse(connected);
        assertContent('<div></div>');
        const part = renderA(template(true), container);
        assert.isTrue(connected);
        // Wait until directive updates value.
        await nextFrame();
        assertContent('<div>B</div>');
        part.setConnected(false);
        assert.isFalse(connected);
        assertContent('<div>B</div>');
        part.setConnected(true);
        assert.isTrue(connected);
        assertContent('<div>B</div>');
      });

      test('renderA with repeatB rendering htmlA and passthruB', () => {
        const items = [0, 1, 2];
        renderA(
          htmlA`<div>${repeatB(
            items,
            (item) => htmlA`<p>${passthruB(`B${item}`)}</p>`
          )}</div>`,
          container
        );
        assertContent('<div><p>B0</p><p>B1</p><p>B2</p></div>');
      });

      test('renderA with repeatB rendering asyncA', async () => {
        const items = [0];
        let connected = false;
        const cb = (c) => (connected = c);
        const template = (bool) =>
          htmlA`<div>${
            bool
              ? repeatB(
                  items,
                  (item) => htmlA`<p>${asyncA(`A${item}`, cb)}</p>`
                )
              : nothingB
          }</div>`;
        renderA(template(true, cb), container);
        assert.isTrue(connected);
        assertContent('<div><p></p></div>');
        // Wait until directive updates value.
        await nextFrame();
        assertContent('<div><p>A0</p></div>');
        renderA(template(false, cb), container);
        assert.isFalse(connected);
        assertContent('<div></div>');
        const part = renderA(template(true, cb), container);
        assert.isTrue(connected);
        assertContent('<div><p></p></div>');
        // Wait until directive updates value.
        await nextFrame();
        assertContent('<div><p>A0</p></div>');
        part.setConnected(false);
        assert.isFalse(connected);
        assertContent('<div><p>A0</p></div>');
        part.setConnected(true);
        assert.isTrue(connected);
        assertContent('<div><p>A0</p></div>');
      });
    });
  }
);
