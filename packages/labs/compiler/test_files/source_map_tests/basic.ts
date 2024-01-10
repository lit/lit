/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, render} from 'lit-html';
export const sayHello = (name: string) => html`<h1>Hello ${name}${'!'}</h1>`;

render(sayHello('potato'), document.body);
