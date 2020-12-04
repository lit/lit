import {html} from 'lit-html';
import {msg} from '../../../lit-localize.js';

msg(`Hello World`, {id: 'extra-expression'});
msg((name: string) => `Hello ${name}`, {
  id: 'missing-expression',
  args: ['Friend'],
});
msg((name: string) => `Hello ${name}`, {
  id: 'changed-expression',
  args: ['Friend'],
});
msg(html`<b>Hello World</b>`, {id: 'missing-html'});
msg(html`<b>Hello World</b>`, {id: 'changed-html'});
