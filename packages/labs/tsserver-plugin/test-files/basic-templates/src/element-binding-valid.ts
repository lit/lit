/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';
import {directive, Directive} from 'lit-html/directive.js';
import {ref} from 'lit/directives/ref.js';

html`<div ${ref(() => {})}></div>`;

class MyDirective extends Directive {
  render() {
    return html``;
  }
}

const myDirective = directive(MyDirective);
html`<div ${myDirective()}></div>`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let anyVar: any;
html`<div ${anyVar}></div>`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let anyOrNumber: any | number;
html`<div ${anyOrNumber}></div>`;
