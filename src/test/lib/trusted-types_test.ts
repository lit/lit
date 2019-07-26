/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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

import {unsafeHTML} from '../../directives/unsafe-html';
import {render} from '../../lib/shady-render.js';
import {html} from '../../lit-html.js';

const assert = chai.assert;

suite('rendering with trusted types enforced', () => {
  let container: HTMLDivElement;

  suiteSetup(() => {
    // tslint:disable-next-line
    (window as any).TrustedTypes = {
      isHTML: () => true,
      createPolicy: () => {
        createHTML: (value: string) => `TRUSTED${value}`;
      },
      isScript: () => false,
      isScriptURL: () => false,
      isURL: () => false,
    };

    // simulate trusted types enforcement in a browser
    Object.defineProperty(HTMLElement.prototype, 'innerHTML', {
      configurable: true,
      set: function(value: string) {
        // lit-html internally calls dangerouslyTurnToTrustedHTML with
        // '<!--{{uniqueId}}-->'
        if (value.startsWith('<!--{{lit-'))
          this.prototype.innerHTML = value;
        else if (value.startsWith('TRUSTED'))
          this.prototype.innerHTML = value.substr('TRUSTED'.length);
        else
          throw new Error(value);
      }
    });

    // create app root in the DOM
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  suiteTeardown(() => {
    delete HTMLElement.prototype.innerHTML;
  });

  test('throws when value is not trusted type', () => {
    const result = html`${unsafeHTML('<b>unsafe bold</b>')}`;
    assert.throws(() => {
      render(result, container, {scopeName: 'div'});
    });
  });

  test('passes when value is trusted type', () => {
    const result = html`${unsafeHTML('TRUSTED<b>unsafe bold</b>')}`;
    assert.throws(() => {
      render(result, container, {scopeName: 'div'});
    });
  });
});
