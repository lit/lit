import {html} from 'lit-html';
import {msg, str} from '../../../lit-localize.js';

const name = 'Friend';

msg(`Hello World`, {id: 'extra-expression'});
msg(str`Hello ${name}`, {id: 'missing-expression'});
msg(str`Hello ${name}`, {id: 'changed-expression'});
msg(html`<b>Hello World</b>`, {id: 'missing-html'});
msg(html`<b>Hello World</b>`, {id: 'changed-html'});
