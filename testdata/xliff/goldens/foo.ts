import {html} from 'lit-html';
import {msg} from '../../../lib_client/index.js';

msg('string', 'Hello World!');

msg('lit', html`Hello <b><i>World!</i></b>`);

msg('variables_1', (name: string) => `Hello ${name}!`, 'World');

msg(
  'lit_variables_1',
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  'World',
  'https://www.example.com/'
);

msg('lit_variables_2', (x: string) => html`${x}y${x}y${x}`, 'x');

msg(
  'lit_variables_3',
  (x: string) => html`<b> ${x} </b>
    <i> y </i>
    <b> ${x} </b>
    <i> y </i>
    <b> ${x} </b>`,
  'x'
);

msg('comment', html`Hello <b><!-- comment -->World!</b>`);
