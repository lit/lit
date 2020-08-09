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
  lit_variables_3: (x: any) => html`<b>
      ${x}
    </b>
    <i>
      y
    </i>
    <b>
      ${x}
    </b>
    <i>
      y
    </i>
    <b>
      ${x}
    </b>`,
  comment: html`Hello <b><!-- comment -->World!</b>`,
};
