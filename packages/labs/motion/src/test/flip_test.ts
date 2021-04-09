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

import {LitElement, css, html, CSSResultGroup, TemplateResult} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {generateElementName, nextFrame} from './test-helpers';
import {flip, Flip, FlipOptions, CSSValues, fadeIn} from '../flip.js';
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

  let theFlip: Flip | undefined;
  let flipProps: CSSValues | undefined;
  let frames: Keyframe[] | undefined;
  let flipElement: Element | undefined;
  const onStart = (flip: Flip) => {
    theFlip = flip;
    flipElement = flip.element;
  };

  const onComplete = (flip: Flip) => {
    flipProps = flip.flipProps!;
    frames = flip.frames!;
  };

  const generateFlipElement = (
    options: FlipOptions = {onStart, onComplete},
    extraCss?: CSSResultGroup,
    childTemplate?: TemplateResult
  ) => {
    const styles = [
      css`
        div {
          position: relative;
        }
        .shift {
          left: 200px;
          top: 200px;
          opacity: 0;
        }
      `,
    ];
    if (extraCss !== undefined) {
      styles.push(extraCss);
    }

    @customElement(generateElementName())
    class A extends LitElement {
      @property() shift = false;
      @query('div') div!: HTMLDivElement;
      static styles = styles;

      render() {
        return html`<div
          class=${classMap({shift: this.shift})}
          ${flip(options)}
        >
          Flip ${childTemplate}
        </div>`;
      }
    }
    return A;
  };

  setup(async () => {
    theFlip = undefined;
    flipProps = undefined;
    frames = undefined;
    flipElement = undefined;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      //container.parentNode.removeChild(container);
    }
  });

  test('onStart/onComplete', async () => {
    let completeEl;
    const onComplete = (flip: Flip) => {
      completeEl = flip.element;
    };

    const El = generateFlipElement({onStart, onComplete});
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    assert.ok(theFlip!);
    assert.equal(el.div, flipElement);
    await theFlip!.finished;
    assert.equal(el.div, completeEl);
  });

  test('animates layout change', async () => {
    const El = generateFlipElement();
    el = new El();
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

    theFlip = undefined;
    frames = undefined;
    el.shift = false;
    await el.updateComplete;
    await theFlip!.finished;
    const r3 = el.div.getBoundingClientRect();
    assert.ok(frames!);
    assert.equal(
      (frames![0].transform as string).trim(),
      'translateX(200px) translateY(200px)'
    );
    assert.equal(r3.left - r2.left, -200);
    assert.equal(r3.top - r2.top, -200);
    assert.deepEqual(flipProps, {left: 200, top: 200});
  });

  test('sets flip animationOptions', async () => {
    const duration = 10;
    const easing = 'linear';
    const fill = 'both';

    const El = generateFlipElement({
      onStart,
      animationOptions: {
        duration,
        easing,
        fill,
      },
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    el.shift = true;
    await el.updateComplete;
    await nextFrame();
    const timing = theFlip?.animation?.effect?.getTiming();
    assert.equal(timing?.duration, duration);
    assert.equal(timing?.easing, easing);
    assert.equal(timing?.fill, fill);
  });

  // TODO(sorvell): `theFlip` ideally is not defined here but it's tricky to
  // marshal options and not have onStart fire. Perhaps change onStart to
  // onBeforeStart?
  test('disabled', async () => {
    const options = {
      onStart,
      onComplete,
      disabled: true,
    };
    const El = generateFlipElement(options);
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    el.shift = true;
    await el.updateComplete;
    await theFlip?.finished;
    assert.notOk(frames);
    options.disabled = false;
    el.shift = false;
    await el.updateComplete;
    await theFlip?.finished;
    assert.ok(frames);
    theFlip = frames = undefined;
    options.disabled = true;
    el.shift = true;
    await el.updateComplete;
    await ((theFlip as unknown) as Flip)?.finished;
    assert.notOk(frames);
  });

  test('guard', async () => {
    let guardValue = 0;
    const guard = () => guardValue;
    const El = generateFlipElement({
      onStart,
      onComplete,
      guard,
      animationOptions: {duration: 10},
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    el.shift = true;
    await el.updateComplete;
    await theFlip?.finished;
    assert.ok(frames);
    // guardValue not changed, so should not run again.
    el.shift = false;
    theFlip = frames = undefined;
    await el.updateComplete;
    await ((theFlip as unknown) as Flip)?.finished;
    assert.notOk(frames);
    // guardValue changed, so should run.
    guardValue = 1;
    el.shift = true;
    theFlip = frames = undefined;
    await el.updateComplete;
    await theFlip!.finished;
    assert.ok(frames);
    // guardValue not changed, so should not run again.
    el.shift = false;
    theFlip = frames = undefined;
    await el.updateComplete;
    await ((theFlip as unknown) as Flip)?.finished;
    assert.notOk(frames);
    // guardValue changed, so should run.
    guardValue = 2;
    el.shift = true;
    theFlip = frames = undefined;
    await el.updateComplete;
    await theFlip!.finished;
    assert.ok(frames);
  });

  test('sets flip properties', async () => {
    const El = generateFlipElement(
      {
        onStart,
        onComplete,
        properties: ['left', 'color'],
      },
      css`
        .shift {
          opacity: 1;
          color: orange;
          background: blue;
        }
      `
    );
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    el.shift = true;
    await el.updateComplete;
    await theFlip!.finished;
    assert.ok(frames!);
    assert.deepEqual(flipProps, {left: -200});
    assert.equal((frames![0].transform as string).trim(), 'translateX(-200px)');
    assert.equal((frames![0].color as string).trim(), 'rgb(0, 0, 0)');
    assert.notOk(frames![0].background);
    assert.equal((frames![1].color as string).trim(), 'rgb(255, 165, 0)');
  });

  test('adjusts for ancestor position', async () => {
    const El = generateFlipElement(
      {
        onStart,
        onComplete,
      },
      css``,
      html``
    );
  });

  test('scaleUp', async () => {});

  test('animates in', async () => {
    const El = generateFlipElement({
      onStart,
      onComplete,
      in: [{transform: 'translateX(-100px)'}],
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await theFlip!.finished;
    assert.ok(frames);
    // no properties calculated when flipping in.
    assert.notOk(flipProps);
    assert.equal((frames![0].transform as string).trim(), 'translateX(-100px)');
  });

  test('onFrames', async () => {});

  test('commit', async () => {});

  test('reset', async () => {});

  test('animates in, skipInitial', async () => {
    const El = generateFlipElement({
      onStart,
      onComplete,
      in: fadeIn,
      skipInitial: true,
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    assert.notOk(theFlip);
    assert.notOk(frames);
  });

  test('animates out', async () => {});

  test('animates out, stabilized', async () => {});

  test('animates in based on an element that animated out', async () => {});
});
