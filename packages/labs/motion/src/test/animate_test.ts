/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html, CSSResultGroup, TemplateResult} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {
  hasWebAnimationsAPI,
  generateElementName,
  nextFrame,
  sleep,
  assertDeepCloseTo,
} from './test-helpers.js';
import {
  animate,
  Animate,
  Options,
  CSSValues,
  fadeIn,
  flyAbove,
  flyBelow,
} from '@lit-labs/motion';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  LitElement.disableWarning?.('change-in-update');
}

const isSafari = /apple/i.test(navigator.vendor);
const testSkipSafari = isSafari ? test.skip : test;

/**
 * TODO
 * 1. work out when onStart/onComplete and animates run
 * 2. disabled: does this call onStart/onComplete: should not.
 * 3. controller tests
 * 4. remove `scaleUp` and maybe `reset` and `commit`.
 */

(hasWebAnimationsAPI ? suite : suite.skip)('Animate', () => {
  let el;
  let container: HTMLElement;

  let theAnimate: Animate | undefined;
  let animateProps: CSSValues | undefined;
  let frames: Keyframe[] | undefined;
  let animateElement: Element | undefined;
  const onStart = (animate: Animate) => {
    theAnimate = animate;
    animateElement = animate.element;
  };

  const onComplete = (animate: Animate) => {
    animateProps = animate.animatingProperties!;
    frames = animate.frames!;
  };

  const generateAnimateElement = (
    options: Options = {onStart, onComplete},
    extraCss?: CSSResultGroup,
    childTemplate?: () => TemplateResult
  ) => {
    const styles: CSSResultGroup = [
      css`
        :host {
          display: block;
        }
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
      static override styles = styles;

      override render() {
        return html`<div
          class="container ${classMap({shift: this.shift})}"
          ${animate(options)}
        >
          Animate ${childTemplate?.()}
        </div>`;
      }
    }
    return A;
  };

  setup(async () => {
    theAnimate = undefined;
    animateProps = undefined;
    frames = undefined;
    animateElement = undefined;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('can animate to zero', async () => {
    class ToZero extends LitElement {
      static override styles = css`
        :host {
          display: block;
        }
        div {
          width: 100px;
          height: 100px;
        }
        div.collapse {
          width: 0;
          height: 0;
        }
      `;

      @property()
      collapse = false;

      @query('div')
      div!: HTMLElement;

      animationComplete = new Promise<void>(
        (res) => (this._onComplete = () => res())
      );

      _onComplete!: () => void;

      override render() {
        return html`
          <div
            class="${this.collapse ? 'collapse' : ''}"
            ${animate({
              onComplete: this._onComplete,
            })}
          ></div>
        `;
      }
    }
    customElements.define(generateElementName(), ToZero);
    const el = new ToZero();
    container.append(el);
    await el.updateComplete;

    const div = el.div;
    const initialRect = div.getBoundingClientRect();
    assert.equal(initialRect.width, 100);
    assert.equal(initialRect.height, 100);

    el.collapse = true;
    await el.updateComplete;
    // The animation hasn't started yet, but the first keyframe should be
    // applied, meaning we have the same size as the initial state. If the
    // size-to-zero bug were present, the size would be 0.
    const startRect = div.getBoundingClientRect();
    assert.equal(startRect.width, 100);
    assert.equal(startRect.height, 100);

    await el.animationComplete;
    const collapsedRect = div.getBoundingClientRect();
    assert.equal(collapsedRect.width, 0);
    assert.equal(collapsedRect.height, 0);
  });

  // TODO(sorvell): when should onComplete go?
  test('onStart/onComplete', async () => {
    let completeEl;
    const onComplete = (animate: Animate) => {
      completeEl = animate.element;
    };

    const El = generateAnimateElement({onStart, onComplete});
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    assert.ok(theAnimate!);
    assert.equal(el.div, animateElement);
    await theAnimate!.finished;
    el.shift = true;
    await el.updateComplete;
    await theAnimate!.finished;
    assert.equal(el.div, completeEl);
  });

  test('animates layout change', async () => {
    const El = generateAnimateElement();
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    const b = el.getBoundingClientRect();
    const r1 = el.div.getBoundingClientRect();
    assert.equal(r1.left - b.left, 0);
    assert.equal(r1.top - b.top, 0);
    el.shift = true;
    await el.updateComplete;
    await theAnimate!.finished;
    assert.ok(frames!);
    assert.equal(
      (frames![0].transform as string).trim(),
      'translateX(-200px) translateY(-200px)'
    );
    assert.equal(frames![1].opacity, 0);
    const r2 = el.div.getBoundingClientRect();
    assert.equal(r2.left - b.left, 200);
    assert.equal(r2.top - b.top, 200);

    theAnimate = undefined;
    frames = undefined;
    el.shift = false;
    await el.updateComplete;
    await theAnimate!.finished;
    const r3 = el.div.getBoundingClientRect();
    assert.ok(frames!);
    assert.equal(
      (frames![0].transform as string).trim(),
      'translateX(200px) translateY(200px)'
    );
    assert.equal(r3.left - r2.left, -200);
    assert.equal(r3.top - r2.top, -200);
    assert.deepEqual(animateProps, {left: 200, top: 200});
  });

  test('sets animate animationOptions', async () => {
    const duration = 10;
    const easing = 'linear';
    const fill = 'both';

    const El = generateAnimateElement({
      onStart,
      keyframeOptions: {
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
    const timing = theAnimate?.webAnimation?.effect?.getTiming();
    assert.equal(timing?.duration, duration);
    assert.equal(timing?.easing, easing);
    assert.equal(timing?.fill, fill);
  });

  // TODO(sorvell): `theAnimate` ideally is not defined here but it's tricky to
  // marshal options and not have onStart fire. Perhaps change onStart to
  // onBeforeStart?
  test('disabled', async () => {
    const options = {
      onStart,
      onComplete,
      disabled: true,
    };
    const El = generateAnimateElement(options);
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    el.shift = true;
    await el.updateComplete;
    await theAnimate?.finished;
    assert.notOk(frames);
    options.disabled = false;
    el.shift = false;
    await el.updateComplete;
    await theAnimate?.finished;
    assert.ok(frames);
    theAnimate = frames = undefined;
    options.disabled = true;
    el.shift = true;
    await el.updateComplete;
    await (theAnimate as unknown as Animate)?.finished;
    assert.notOk(frames);
  });

  test('guard', async () => {
    let guardValue = 0;
    const guard = () => guardValue;
    const El = generateAnimateElement({
      onStart,
      onComplete,
      guard,
      keyframeOptions: {duration: 10},
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    el.shift = true;
    await el.updateComplete;
    await theAnimate?.finished;
    assert.ok(frames);
    // guardValue not changed, so should not run again.
    el.shift = false;
    theAnimate = frames = undefined;
    await el.updateComplete;
    await (theAnimate as unknown as Animate)?.finished;
    assert.notOk(frames);
    // guardValue changed, so should run.
    guardValue = 1;
    el.shift = true;
    theAnimate = frames = undefined;
    await el.updateComplete;
    await theAnimate!.finished;
    assert.ok(frames);
    // guardValue not changed, so should not run again.
    el.shift = false;
    theAnimate = frames = undefined;
    await el.updateComplete;
    await (theAnimate as unknown as Animate)?.finished;
    assert.notOk(frames);
    // guardValue changed, so should run.
    guardValue = 2;
    el.shift = true;
    theAnimate = frames = undefined;
    await el.updateComplete;
    await theAnimate!.finished;
    assert.ok(frames);
  });

  test('guard - array', async () => {
    let guardValue = [1, 2, 3];
    const guard = () => guardValue;
    const El = generateAnimateElement({
      onStart,
      onComplete,
      guard,
      keyframeOptions: {duration: 10},
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    el.shift = true;
    await el.updateComplete;
    await theAnimate?.finished;
    assert.ok(frames);
    // guardValue not changed, so should not run again.
    el.shift = false;
    theAnimate = frames = undefined;
    await el.updateComplete;
    await (theAnimate as unknown as Animate)?.finished;
    assert.notOk(frames);
    // guardValue changed, so should run.
    guardValue = [1, 2, 3, 4];
    el.shift = true;
    theAnimate = frames = undefined;
    await el.updateComplete;
    await theAnimate!.finished;
    assert.ok(frames);
    // guardValue not changed, so should not run again.
    el.shift = false;
    theAnimate = frames = undefined;
    await el.updateComplete;
    await (theAnimate as unknown as Animate)?.finished;
    assert.notOk(frames);
    // guardValue changed, so should run.
    guardValue = [1, 2];
    el.shift = true;
    theAnimate = frames = undefined;
    await el.updateComplete;
    await theAnimate!.finished;
    assert.ok(frames);
  });

  test('sets animate properties', async () => {
    const El = generateAnimateElement(
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
    await theAnimate!.finished;
    assert.ok(frames!);
    assert.deepEqual(animateProps, {left: -200});
    assert.equal((frames![0].transform as string).trim(), 'translateX(-200px)');
    assert.equal((frames![0].color as string).trim(), 'rgb(0, 0, 0)');
    assert.notOk(frames![0].background);
    assert.equal((frames![1].color as string).trim(), 'rgb(255, 165, 0)');
  });

  testSkipSafari('adjusts for ancestor position', async () => {
    let shiftChild = false;
    let shiftGChild = false;
    let childAnimateProps: CSSValues;
    let gChildAnimate: Animate, gChildAnimateProps: CSSValues;
    const childComplete = (animate: Animate) => {
      childAnimateProps = animate.animatingProperties!;
    };
    const gChildStart = (animate: Animate) => (gChildAnimate = animate);
    const gChildComplete = (animate: Animate) => {
      gChildAnimateProps = animate.animatingProperties!;
    };
    const El = generateAnimateElement(
      {
        keyframeOptions: {fill: 'both'},
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
        ${animate({onComplete: childComplete})}
      >
        Child
        <div
          class="gChild ${classMap({shiftGChild})}"
          ${animate({onStart: gChildStart, onComplete: gChildComplete})}
        >
          GChild
        </div>
      </div>`
    );
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await gChildAnimate!.finished;
    el.shift = true;
    shiftChild = true;
    shiftGChild = true;
    await el.updateComplete;
    await gChildAnimate!.finished;
    assert.deepEqual(childAnimateProps!, {
      left: 50,
      top: -20,
      width: 0.5,
      height: 0.5,
    });
    assert.deepEqual(gChildAnimateProps!, {left: 50, top: -20});
    el.shift = false;
    shiftChild = false;
    shiftGChild = false;
    await el.updateComplete;
    await gChildAnimate!.finished;
    assertDeepCloseTo(childAnimateProps!, {
      left: -100,
      top: 40,
      width: 2,
      height: 2,
    });
    assertDeepCloseTo(gChildAnimateProps!, {left: -50, top: 20});
  });

  test('animates in', async () => {
    const El = generateAnimateElement({
      onStart,
      onComplete,
      in: [{transform: 'translateX(-100px)'}],
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await theAnimate!.finished;
    assert.ok(frames);
    // no properties calculated when animateping in.
    assert.notOk(animateProps);
    assert.equal((frames![0].transform as string).trim(), 'translateX(-100px)');
  });

  test('onFrames', async () => {
    const mod = 'translateX(100px) translateY(100px)';
    const onFrames = (animate: Animate) => {
      if (animate.frames === undefined) {
        return;
      }
      animate.frames[0].transform! = mod;
      return animate.frames!;
    };
    const El = generateAnimateElement({
      onStart,
      onComplete,
      onFrames,
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await theAnimate!.finished;
    el.shift = true;
    await el.updateComplete;
    await theAnimate!.finished;
    assert.ok(frames);
    assert.deepEqual(frames![0].transform, mod);
  });

  test('animates in, skipInitial', async () => {
    const El = generateAnimateElement({
      onStart,
      onComplete,
      in: fadeIn,
      skipInitial: true,
    });
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    assert.notOk(theAnimate);
    assert.notOk(frames);
  });

  test('animates out', async () => {
    let shouldRender = true;
    let disconnectAnimate: Animate, disconnectFrames: Keyframe[];
    const onDisconnectStart = (animate: Animate) => {
      disconnectAnimate = animate;
    };

    const onDisconnectComplete = (animate: Animate) => {
      disconnectFrames = animate.frames!;
    };
    const outFrames = flyBelow;
    const El = generateAnimateElement(
      undefined,
      undefined,
      () =>
        html`${shouldRender
          ? html`<div
              ${animate({
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
    await disconnectAnimate!.finished;
    shouldRender = false;
    el.requestUpdate();
    await el.updateComplete;
    await disconnectAnimate!.finished;
    assert.equal(disconnectFrames!, outFrames);
  });

  test('animates out, stabilizeOut', async () => {
    let shouldRender = true;
    let disconnectAnimate: Animate;
    let disconnectElement: HTMLElement;
    let startCalls = 0;
    const onStart = (animate: Animate) => {
      startCalls++;
      disconnectAnimate = animate;
      disconnectElement = animate.element;
      const p = disconnectElement!.parentElement!.getBoundingClientRect();
      const r = disconnectElement!.getBoundingClientRect();
      const s =
        disconnectElement!.previousElementSibling!.getBoundingClientRect();
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

    const El = generateAnimateElement(
      undefined,
      undefined,
      () =>
        html`<div
            style="vertical-align: bottom; height: ${shouldRender
              ? '0px'
              : '100px'}"
          ></div>
          ${shouldRender ? html`<div ${animate(options)}>Out</div>` : ''}`
    );
    el = new El();
    container.appendChild(el);
    await el.updateComplete;
    await disconnectAnimate!.finished;
    assert.equal(startCalls, 1);
    shouldRender = false;
    el.requestUpdate();
    await el.updateComplete;
    await disconnectAnimate!.finished;
    assert.equal(startCalls, 2);
    shouldRender = true;
    el.requestUpdate();
    await el.updateComplete;
    await disconnectAnimate!.finished;
    assert.equal(startCalls, 3);
    options.stabilizeOut = true;
    shouldRender = false;
    el.requestUpdate();
    await el.updateComplete;
    await disconnectAnimate!.finished;
    assert.equal(startCalls, 4);
  });

  // TODO(sorvell) This is too flakey on Safari.
  testSkipSafari(
    'animates in based on an element that animated out',
    async () => {
      let shouldRender = true;
      let oneAnimate: Animate | undefined, twoAnimate: Animate | undefined;
      let oneFrames: Keyframe[] | undefined, twoFrames: Keyframe[] | undefined;
      const onOneStart = (animate: Animate) => {
        oneAnimate = animate;
      };
      const onOneComplete = (animate: Animate) => {
        oneFrames = animate.frames;
      };
      const onTwoStart = (animate: Animate) => {
        twoAnimate = animate;
      };
      const onTwoComplete = (animate: Animate) => {
        twoFrames = animate.frames;
      };
      const El = generateAnimateElement(
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
                ${animate({
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
                ${animate({
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
      await oneAnimate?.finished;
      await twoAnimate?.finished;
      shouldRender = false;
      el.requestUpdate();
      oneFrames = twoFrames = undefined;
      await el.updateComplete;
      await twoAnimate?.finished;
      // Note, workaround Safari flakiness by waiting slightly here.
      await sleep();
      assert.equal(oneFrames, flyAbove);
      assert.equal(
        (twoFrames![0].transform! as string).trim(),
        'translateY(-20px)'
      );
      oneFrames = twoFrames = undefined;
      shouldRender = true;
      el.requestUpdate();
      await el.updateComplete;
      await twoAnimate?.finished;
      // Note, workaround Safari flakiness by waiting slightly here.
      await sleep();
      assert.equal(twoFrames, flyBelow);
      assert.equal(
        (oneFrames![0].transform! as string).trim(),
        'translateY(20px)'
      );
    }
  );
});
