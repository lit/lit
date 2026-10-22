import {html} from 'lit-html';

const inner = () => html`<p>Inner</p>`;
const outer = () => html`<div>${inner()}</div>`;
