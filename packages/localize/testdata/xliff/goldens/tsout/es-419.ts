// Do not modify this file by hand!
// Re-generate this file by running lit-localize

import {html} from 'lit-html';

/* eslint-disable no-irregular-whitespace */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const templates = {
  '0h3c44aff2d5f5ef6b': html`Hola <b>Mundo</b>!`,
  '0h82ccc38d4d46eaa9': (name: any) => html`Hola <b>${name}</b>!`,
  '0s00ad08ebae1e0f74': (name: any) => `Hola ${name}!`,
  '0s8c0ec8d1fb9e6e32': `Hola Mundo!`,
  comment: html`Hola <b><!-- comment -->Mundo!</b>`,
  lit: html`Hola <b><i>Galaxia!</i></b>`,
  lit_variables_1: (url: any, name: any) =>
    html`Hola ${name}, clic <a href="${url}">aquí</a>!`,
  string: `Hola Mundo!`,
  variables_1: (name: any) => `Hola ${name}!`,
  lit_variables_2: (x: any) => html`${x}y${x}y${x}`,
  lit_variables_3: (x: any) => html`<b>${x}</b>
    <i>y</i>
    <b>${x}</b>
    <i>y</i>
    <b>${x}</b>`,
};
