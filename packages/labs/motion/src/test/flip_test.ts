/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import {LitElement, css, html} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {generateElementName} from './test-helpers';
import {flip, Flip} from '../flip.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  LitElement.disableWarning?.('change-in-update');
}

suite('Flip', () => {
  let el;
  let container: HTMLElement;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      //container.parentNode.removeChild(container);
    }
  });

  test('onStart/onComplete', async () => {
    let startEl, completeEl;
    let theFlip: Flip;
    const onStart = (flip: Flip) => {
      theFlip = flip;
      startEl = flip.element;
    };

    const onComplete = (flip: Flip) => {
      completeEl = flip.element;
    };

    @customElement(generateElementName())
    class A extends LitElement {
      @property() shift = false;
      @query('div') div!: HTMLDivElement;

      render() {
        return html`<div ${flip({onStart, onComplete})}>Flip</div>`;
      }
    }
    el = new A();
    container.appendChild(el);
    await el.updateComplete;
    assert.ok(theFlip!);
    assert.equal(el.div, startEl);
    await theFlip!.finished;
    assert.equal(el.div, completeEl);
  });

  test('animates layout change', async () => {
    let theFlip: Flip;
    let flipProps, frames: Keyframe[];
    const onStart = (flip: Flip) => {
      theFlip = flip;
    };

    const onComplete = (flip: Flip) => {
      flipProps = flip.flipProps;
      frames = flip.frames!;
    };

    @customElement(generateElementName())
    class A extends LitElement {
      @property() shift = false;
      @query('div') div!: HTMLDivElement;
      static styles = css`
        div {
          position: relative;
          display: inline-block;
        }
        .shift {
          left: 200px;
          top: 200px;
          opacity: 0;
        }
      `;

      render() {
        return html`<div
          class=${classMap({shift: this.shift})}
          ${flip({onStart, onComplete})}
        >
          Flip
        </div>`;
      }
    }
    el = new A();
    container.appendChild(el);
    await el.updateComplete;
    const b = el.getBoundingClientRect();
    const r1 = el.div.getBoundingClientRect();
    assert.equal(r1.left - b.left, 0);
    assert.equal(r1.top - b.top, 0);
    el.shift = true;
    await el.updateComplete;
    await theFlip!.finished;
    assert.ok(frames!);
    assert.equal(
      (frames![0].transform as string).trim(),
      'translateX(-200px) translateY(-200px)'
    );
    assert.equal(frames![1].opacity, 0);
    const r2 = el.div.getBoundingClientRect();
    assert.equal(r2.left - b.left, 200);
    assert.equal(r2.top - b.top, 200);
    assert.deepEqual(flipProps, {left: -200, top: -200});
  });

  test('sets flip animationOptions', async () => {});

  test('skipInitial', async () => {});

  test('disabled', async () => {});

  test('guard', async () => {});

  test('commit', async () => {});

  test('reset', async () => {});

  test('scaleUp', async () => {});

  test('sets flip properties', async () => {});

  test('animates multiple layout changes', async () => {});

  test('adjusts for ancestor position', async () => {});

  test('animates in', async () => {});

  test('animates out', async () => {});

  test('animates out, stabilized', async () => {});

  test('animates in based on an element that animated out', async () => {});
});
