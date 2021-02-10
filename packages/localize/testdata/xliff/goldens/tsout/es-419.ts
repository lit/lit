/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Do not modify this file by hand!
// Re-generate this file by running lit-localize

import {html} from 'lit-html';

/* eslint-disable no-irregular-whitespace */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const templates = {
  comment: html`Hola <b><!-- comment -->Mundo!</b>`,
  h3c44aff2d5f5ef6b: html`Hola <b>Mundo</b>!`,
  h82ccc38d4d46eaa9: (name: any) => html`Hola <b>${name}</b>!`,
  lit: html`Hola <b><i>Galaxia!</i></b>`,
  lit_variables_1: (url: any, name: any) =>
    html`Hola ${name}, clic <a href="${url}">aquí</a>!`,
  s00ad08ebae1e0f74: (name: any) => `Hola ${name}!`,
  s8c0ec8d1fb9e6e32: `Hola Mundo!`,
  string: `Hola Mundo!`,
  variables_1: (name: any) => `Hola ${name}!`,
  lit_variables_2: (x: any) => html`${x}y${x}y${x}`,
  lit_variables_3: (x: any) => html`<b>${x}</b>
    <i>y</i>
    <b>${x}</b>
    <i>y</i>
    <b>${x}</b>`,
  s03c68d79ad36e8d4: `described 0`,
  s03c68e79ad36ea87: `described 1`,
  s03c68f79ad36ec3a: `described 2`,
};
