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

import {LitElement /*css, html, CSSResultGroup, TemplateResult*/} from 'lit';
// import {customElement, property, query} from 'lit/decorators.js';
// import {classMap} from 'lit/directives/class-map.js';
// import {generateElementName, nextFrame} from './test-helpers';
// import {flip, Flip, FlipOptions, CSSValues} from '../flip.js';
// import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!LitElement.enableWarning;

if (DEV_MODE) {
  LitElement.disableWarning?.('change-in-update');
}

// suite('FlipController', () => {
//   let el;
//   let container: HTMLElement;

//   let theFlip: Flip | undefined;
//   let flipProps: CSSValues | undefined;
//   let frames: Keyframe[] | undefined;
//   let flipElement: Element | undefined;
//   const onStart = (flip: Flip) => {
//     theFlip = flip;
//     flipElement = flip.element;
//   };

//   const onComplete = (flip: Flip) => {
//     flipProps = flip.flipProps!;
//     frames = flip.frames!;
//   };

//   const generateFlipElement = (
//     options: FlipOptions = {onStart, onComplete},
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
//           ${flip(options)}
//         >
//           Flip ${childTemplate?.()}
//         </div>`;
//       }
//     }
//     return A;
//   };

//   setup(async () => {
//     theFlip = undefined;
//     flipProps = undefined;
//     frames = undefined;
//     flipElement = undefined;
//     container = document.createElement('div');
//     document.body.appendChild(container);
//   });

//   teardown(() => {
//     if (container && container.parentNode) {
//       container.parentNode.removeChild(container);
//     }
//   });

//   test('pass options to flips', async () => {
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
