import {html} from 'lit-html';
import {msg} from '../../../lib_client/index.js';

msg('string', 'Hello World!');

msg('lit', html`Hello <b><i>World!</i></b>`);

msg('variables_1', (name: string) => `Hello ${name}!`, 'World');

msg(
  'lit_variables_1',
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  'https://www.example.com/',
  'World'
);
