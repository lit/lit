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

import * as LibDefaultTemplateProcessor from '../lib/default-template-processor.js';
import * as LibDirective from '../lib/directive.js';
import * as LibPart from '../lib/part.js';
import * as LibParts from '../lib/parts.js';
import * as LibRender from '../lib/render.js';
import * as LibTemplateFactory from '../lib/template-factory.js';
import * as LibTemplateInstance from '../lib/template-instance.js';
import * as LibTemplateResult from '../lib/template-result.js';
import * as LitHtml from '../lit-html.js';

const assert = chai.assert;

suite('index.js', () => {
  test('html tag returns a TemplateResult', () => {
    assert.instanceOf(LitHtml.html``, LibTemplateResult.TemplateResult);
  });

  test('svg tag returns a SVGTemplateResult', () => {
    assert.instanceOf(LitHtml.svg``, LibTemplateResult.SVGTemplateResult);
  });

  test('exports everything from lib/template-result.js', () => {
    Object.keys(LibTemplateResult).forEach((key) => {
      assert.property(LitHtml, key);
    });
  });

  test('exports everything from lib/default-template-processor.js', () => {
    Object.keys(LibDefaultTemplateProcessor).forEach((key) => {
      assert.property(LitHtml, key);
    });
  });

  test('exports everything from lib/template-instance.js', () => {
    Object.keys(LibTemplateInstance).forEach((key) => {
      assert.property(LitHtml, key);
    });
  });

  test('exports everything from lib/part.js', () => {
    Object.keys(LibPart).forEach((key) => {
      assert.property(LitHtml, key);
    });
  });

  test('exports everything from lib/parts.js', () => {
    Object.keys(LibParts).forEach((key) => {
      assert.property(LitHtml, key);
    });
  });

  test('exports everything from lib/directive.js', () => {
    Object.keys(LibDirective).forEach((key) => {
      assert.property(LitHtml, key);
    });
  });

  test('exports everything from lib/render.js', () => {
    Object.keys(LibRender).forEach((key) => {
      assert.property(LitHtml, key);
    });
  });

  test('exports everything from lib/template-factory.js', () => {
    Object.keys(LibTemplateFactory).forEach((key) => {
      assert.property(LitHtml, key);
    });
  });

  test('adds a version number', () => {
    assert.equal(window['litHtmlVersions'].length, 1);
  });
});
