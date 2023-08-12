import {html} from 'lit-html';
import {ref} from 'lit-html/directives/ref.js';

const one = html`<input ${ref(console.log)}>`;
