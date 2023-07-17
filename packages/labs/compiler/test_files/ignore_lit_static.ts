import {html, literal} from 'lit-html/static.js';
import {render} from 'lit';
render(html`${literal`<p>Hello</p>`}`, document.body);
