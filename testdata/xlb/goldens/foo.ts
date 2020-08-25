import {html} from 'lit-html';
import * as litLocalize from '../../../lib_client/index.js';

litLocalize.msg('string', 'Hello World!');

litLocalize.msg('lit', html`Hello <b><i>World!</i></b>`);

litLocalize.msg('variables_1', (name: string) => `Hello ${name}!`, 'World');

litLocalize.msg(
  'lit_variables_1',
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  'World',
  'https://www.example.com/'
);

litLocalize.msg('lit_variables_2', (x: string) => html`${x}y${x}y${x}`, 'x');

litLocalize.msg(
  'lit_variables_3',
  (x: string) => html`<b> ${x} </b>
    <i> y </i>
    <b> ${x} </b>
    <i> y </i>
    <b> ${x} </b>`,
  'x'
);
