/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement /*css, html, CSSResultGroup, TemplateResult*/} from 'lit';
// import {customElement, property, query} from 'lit/decorators.js';
// import {classMap} from 'lit/directives/class-map.js';
// import {generateElementName, nextFrame} from './test-helpers';
// import {animate, Animate, AnimateOptions, CSSValues} from '../animate.js';
// import {assert} from 'chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  LitElement.disableWarning?.('change-in-update');
}

// suite('AnimateController', () => {
//   let el;
//   let container: HTMLElement;

//   let theAnimate: Animate | undefined;
//   let animateProps: CSSValues | undefined;
//   let frames: Keyframe[] | undefined;
//   let animateElement: Element | undefined;
//   const onStart = (animate: Animate) => {
//     theAnimate = animate;
//     animateElement = animate.element;
//   };

//   const onComplete = (animate: Animate) => {
//     animateProps = animate.animateProps!;
//     frames = animate.frames!;
//   };

//   const generateAnimateElement = (
//     options: AnimateOptions = {onStart, onComplete},
//     extraCss?: CSSResultGroup,
//     childTemplate?: () => TemplateResult
//   ) => {
//     const styles = [
//       css`
//         * { box-sizing: border-box; }
//         div {
//           display: inline-block;
//           outline: 1px dotted black;
//           position: relative;
//         }

//         .container {
//           height: 200px;
//           width: 200px;
//         }
//         .shift {
//           left: 200px;
//           top: 200px;
//           opacity: 0;
//         }
//       `,
//     ];
//     if (extraCss !== undefined) {
//       styles.push(extraCss);
//     }

//     @customElement(generateElementName())
//     class A extends LitElement {
//       @property() shift = false;
//       @query('div') div!: HTMLDivElement;
//       static styles = styles;

//       render() {
//         return html`<div
//           class="container ${classMap({shift: this.shift})}"
//           ${animate(options)}
//         >
//           Animate ${childTemplate?.()}
//         </div>`;
//       }
//     }
//     return A;
//   };

//   setup(async () => {
//     theAnimate = undefined;
//     animateProps = undefined;
//     frames = undefined;
//     animateElement = undefined;
//     container = document.createElement('div');
//     document.body.appendChild(container);
//   });

//   teardown(() => {
//     if (container && container.parentNode) {
//       container.parentNode.removeChild(container);
//     }
//   });

//   test('pass options to animates', async () => {
//   });

//   test('startPaused', async () => {
//   });

//   test('disabled', async () => {
//   });

//   test('onComplete', async () => {

//   });

//   test('play/pause/togglePlay', async () => {

//   });

//   test('cancel', async () => {

//   });

//   test('finish', async () => {

//   });

// });
