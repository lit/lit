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

import {partRef, partRefs} from '../../directives/part-ref.js';
import {render} from '../../lib/render.js';
import {html, Part} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

suite('partRef', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('normal behaviour', () => {
    render(
        html`<div class="btn" foo=${partRef('old value', 'fooP')}></div>`,
        container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div class="btn" foo="old value"></div>');
  });

  test('updating part value', () => {
    render(
        html`<div class="btn" foo=${partRef('old value', 'fooP')}></div>`,
        container);
    const btnEl: HTMLDivElement|undefined =
        container.children[0] as HTMLDivElement;
    if (btnEl && partRefs.has(btnEl)) {
      const parts: {[k: string]: Part}|undefined = partRefs.get(btnEl);
      if (parts) {
        const part: Part = parts.fooP;
        if (part) {
          part.setValue('value-changed');
          part.commit();
        }
      }
    }
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div class="btn" foo="value-changed"></div>');
  });
});

/*
* let tpl = html`
* <div id="btn" class=${partRef('cls1', 'class')}>${partRef('contents',
'body')}</div>
* `
* render(tpl, document.body);

* let parts = partRefs.get(document.getElementById('btn'))
* parts['class'].setValue("new class")
* parts['class'].commit();
* parts['body'].setValue("new contents")
* parts['body'].commit();
*/
