import {html} from 'lit-html';
const text = 'text';
const node = document.createElement('span');
export const one = html`${text}
  <!-- Comment binding '${text}' -->
  ${node}`;
