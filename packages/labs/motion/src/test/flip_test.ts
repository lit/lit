/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html, CSSResultGroup, TemplateResult} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {generateElementName, nextFrame} from './test-helpers';
import {
  flip,
  Flip,
  FlipOptions,
  CSSValues,
  fadeIn,
  flyAbove,
  flyBelow,
} from '../flip.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  LitElement.disableWarning?.('change-in-update');
}

/**
 * TODO
 * 1. work out when onStart/onComplete and flips run
 * 2. disabled: does this call onStart/onComplete: should not.
 * 3. controller tests
 * 4. remove `scaleUp` and maybe `reset` and `commit`.
 */

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
    childTemplate?: () => TemplateResult
  ) => {
    const styles = [
      css`
        * {
          box-sizing: border-box;
        }
        div {
          display: inline-block;
          outline: 1px dotted black;
          position: relative;
        }

        .container {
          height: 200px;
          width: 200px;
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
          class="container ${classMap({shift: this.shift})}"
          ${flip(options)}
        >
          Flip ${childTemplate?.()}
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
      container.parentNode.removeChild(container);
    }
  });

  // TODO(sorvell): when should onComplete go?
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
    el.shift = true;
    await el.updateComplete;
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

  test('guard - array', async () => {
    let guardValue = [1, 2, 3];
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
    guardValue = [1, 2, 3, 4];
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
    guardValue = [1, 2];
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
    let shiftChild = false;
    let shiftGChild = false;
    let childFlipProps: CSSValues;
    let gChildFlip: Flip, gChildFlipProps: CSSValues;
    const childComplete = (flip: Flip) => {
      childFlipProps = flip.flipProps!;
    };
    const gChildStart = (flip: Flip) => (gChildFlip = flip);
    const gChildComplete = (flip: Flip) => {
      gChildFlipProps = flip.flipProps!;
    };
    const El = generateFlipElement(
      {
        animationOptions: {fill: 'both'},
      },
      css`
        .shift {
          height: 100px;
          width: 100px;
        }
        .child {
          position: absolute;
          right: 0;
          width: 100px;
        }
        .shiftChild {
          left: 0;
          top: 20px;
        }
        .gChild {
          position: absolute;
          right: 0;
          width: 50px;
        }

        .shiftGChild {
          left: 0;
          top: 20px;
        }
      `,
      () => html`<div
        class="child ${classMap({shiftChild})}"
        ${flip({onComplete: childComplete})}
      >
        Child
        <div
          class="gChild ${classMap({shiftGChild})}"
          ${flip({onStart: gChildStart, onComplete: gChildComplete})}
        >
          GChild
        </div>
      </div>`
    );
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await gChildFlip!.finished;
    el.shift = true;
    shiftChild = true;
    shiftGChild = true;
    await el.updateComplete;
    await gChildFlip!.finished;
    assert.deepEqual(childFlipProps!, {
      left: 50,
      top: -20,
      width: 0.5,
      height: 0.5,
    });
    assert.deepEqual(gChildFlipProps!, {left: 50, top: -20});
    el.shift = false;
    shiftChild = false;
    shiftGChild = false;
    await el.updateComplete;
    await gChildFlip!.finished;
    assert.deepEqual(childFlipProps!, {
      left: -100,
      top: 40,
      width: 2,
      height: 2,
    });
    assert.deepEqual(gChildFlipProps!, {left: -50, top: 20});
  });

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

  test('onFrames', async () => {
    const mod = 'translateX(100px) translateY(100px)';
    const onFrames = (flip: Flip) => {
      if (flip.frames === undefined) {
        return;
      }
      flip.frames[0].transform! = mod;
      return flip.frames!;
    };
    const El = generateFlipElement({
      onStart,
      onComplete,
      onFrames,
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await theFlip!.finished;
    el.shift = true;
    await el.updateComplete;
    await theFlip!.finished;
    assert.ok(frames);
    assert.deepEqual(frames![0].transform, mod);
  });

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

  test('animates out', async () => {
    let shouldRender = true;
    let disconnectFlip: Flip, disconnectFrames: Keyframe[];
    const onDisconnectStart = (flip: Flip) => {
      disconnectFlip = flip;
    };

    const onDisconnectComplete = (flip: Flip) => {
      disconnectFrames = flip.frames!;
    };
    const outFrames = flyBelow;
    const El = generateFlipElement(
      undefined,
      undefined,
      () =>
        html`${shouldRender
          ? html`<div
              ${flip({
                onStart: onDisconnectStart,
                onComplete: onDisconnectComplete,
                out: outFrames,
              })}
            >
              Out
            </div>`
          : ''}`
    );
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await disconnectFlip!.finished;
    shouldRender = false;
    el.requestUpdate();
    await el.updateComplete;
    await disconnectFlip!.finished;
    assert.equal(disconnectFrames!, outFrames);
  });

  test('animates out, stabilizeOut', async () => {
    let shouldRender = true;
    let disconnectFlip: Flip;
    let disconnectElement: HTMLElement;
    let startCalls = 0;
    const onStart = (flip: Flip) => {
      startCalls++;
      disconnectFlip = flip;
      disconnectElement = flip.element;
      const p = disconnectElement!.parentElement!.getBoundingClientRect();
      const r = disconnectElement!.getBoundingClientRect();
      const s = disconnectElement!.previousElementSibling!.getBoundingClientRect();
      if (!shouldRender) {
        assert.equal(
          r.bottom - p.top,
          options.stabilizeOut ? r.height : s.height
        );
      }
    };
    const options = {
      onStart,
      out: flyBelow,
      stabilizeOut: false,
    };

    const El = generateFlipElement(
      undefined,
      undefined,
      () =>
        html`<div
            style="vertical-align: bottom; height: ${shouldRender
              ? '0px'
              : '100px'}"
          ></div>
          ${shouldRender ? html`<div ${flip(options)}>Out</div>` : ''}`
    );
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await disconnectFlip!.finished;
    assert.equal(startCalls, 1);
    shouldRender = false;
    el.requestUpdate();
    await el.updateComplete;
    await disconnectFlip!.finished;
    assert.equal(startCalls, 2);
    shouldRender = true;
    el.requestUpdate();
    await el.updateComplete;
    await disconnectFlip!.finished;
    assert.equal(startCalls, 3);
    options.stabilizeOut = true;
    shouldRender = false;
    el.requestUpdate();
    await el.updateComplete;
    await disconnectFlip!.finished;
    assert.equal(startCalls, 4);
  });

  test('animates in based on an element that animated out', async () => {
    let shouldRender = true;
    let oneFlip: Flip | undefined, twoFlip: Flip | undefined;
    let oneFrames: Keyframe[] | undefined, twoFrames: Keyframe[] | undefined;
    const onOneStart = (flip: Flip) => {
      oneFlip = flip;
    };
    const onOneComplete = (flip: Flip) => {
      oneFrames = flip.frames;
    };
    const onTwoStart = (flip: Flip) => {
      twoFlip = flip;
    };
    const onTwoComplete = (flip: Flip) => {
      twoFrames = flip.frames;
    };
    const El = generateFlipElement(
      undefined,
      css`
        .one {
          position: absolute;
          top: 20px;
          width: 50px;
        }
        .two {
          position: absolute;
          top: 40px;
          width: 50px;
        }
      `,
      () =>
        html`${shouldRender
          ? html`<div
              class="one"
              ${flip({
                id: '1',
                inId: '2',
                onStart: onOneStart,
                onComplete: onOneComplete,
                out: flyAbove,
                in: fadeIn,
                skipInitial: true,
              })}
            >
              Out
            </div>`
          : html`<div
              class="two"
              ${flip({
                id: '2',
                inId: '1',
                onStart: onTwoStart,
                onComplete: onTwoComplete,
                in: fadeIn,
                out: flyBelow,
              })}
            >
              In
            </div>`}`
    );
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await oneFlip?.finished;
    await twoFlip?.finished;
    shouldRender = false;
    el.requestUpdate();
    oneFrames = twoFrames = undefined;
    await el.updateComplete;
    await twoFlip?.finished;
    assert.equal(oneFrames, flyAbove);
    assert.equal(
      (twoFrames![0].transform! as string).trim(),
      'translateY(-20px)'
    );
    oneFrames = twoFrames = undefined;
    shouldRender = true;
    el.requestUpdate();
    await el.updateComplete;
    await twoFlip?.finished;
    assert.equal(twoFrames, flyBelow);
    assert.equal(
      (oneFrames![0].transform! as string).trim(),
      'translateY(20px)'
    );
  });
});
