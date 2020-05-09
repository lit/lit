import {html} from 'lit-html';
import {msg} from './tsout/localization';

export const a = msg('string', 'Hello World!');

export const b = msg('lit', html`Hello <b>World!</b>`);

export const c = msg('variable', (name: string) => `Hello ${name}!`, 'World');

export const d = msg(
  'lit_variables',
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  'World',
  'https://www.example.com/'
);
