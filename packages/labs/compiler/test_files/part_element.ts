import {html} from 'lit-html';
import {ref} from 'lit-html/directives/ref.js';

// Ensure that part order is respected in compiled output.
const one = html`<input a=${'a'} ${ref(console.log)} b=${'b'}>`;
