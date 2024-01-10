import { html } from 'lit-html';
import { ref } from 'lit-html/directives/ref.js';
import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
const { AttributePart: A_1 } = litHtmlPrivate_1._$LH;
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<input>`, parts: [{ type: 1, index: 0, name: "a", strings: ["", ""], ctor: A_1 }, { type: 6, index: 0 }, { type: 1, index: 0, name: "b", strings: ["", ""], ctor: A_1 }] };
// Ensure that part order is respected in compiled output.
const one = { ["_$litType$"]: lit_template_1, values: ['a', ref(console.log), 'b'] };
