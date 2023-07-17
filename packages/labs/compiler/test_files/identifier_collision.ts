import {html} from 'lit-html';
import {_$LH as litHtmlPrivate} from 'lit-html/private-ssr-support.js';

const BooleanAttributePart = false;

const booleanAttributePart = html`<div ?data-attr="${true}"></div>`;
