import {html} from 'lit-html';
import {msg} from '../../../lit-localize.js';

msg('extra-expression', `Hello World`);
msg('missing-expression', (name: string) => `Hello ${name}`, 'Friend');
msg('changed-expression', (name: string) => `Hello ${name}`, 'Friend');
msg('missing-html', html`<b>Hello World</b>`);
msg('changed-html', html`<b>Hello World</b>`);
