// Do not modify this file by hand!
// Re-generate this file by running lit-localize

import {html} from 'lit-html';

/* eslint-disable no-irregular-whitespace */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const templates = {
  string: `Hello World!`,
  lit: html`Hello <b><i>World!</i></b>`,
  variables_1: (name: any) => `Hello ${name}!`,
  lit_variables_1: (url: any, name: any) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  lit_variables_2: (x: any) => html`${x}y${x}y${x}`,
  lit_variables_3: (x: any) => html`<b>${x}</b>
    <i>y</i>
    <b>${x}</b>
    <i>y</i>
    <b>${x}</b>`,
  comment: html`Hello <b><!-- comment -->World!</b>`,
  s8c0ec8d1fb9e6e32: `Hello World!`,
  s00ad08ebae1e0f74: (name: any) => `Hello ${name}!`,
  h3c44aff2d5f5ef6b: html`Hello <b>World</b>!`,
  h82ccc38d4d46eaa9: (name: any) => html`Hello <b>${name}</b>!`,
  s03c68d79ad36e8d4: `described 0`,
  s03c68e79ad36ea87: `described 1`,
  s03c68f79ad36ec3a: `described 2`,
};
