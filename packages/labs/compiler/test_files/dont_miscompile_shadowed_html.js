import { html } from 'lit';
import * as litStatic from 'lit-html/static.js';

function trickyTemplate() {
  const html = litStatic.html;
  return html`Do not compile me, I am static!`;
}

html`Compile me!`;
