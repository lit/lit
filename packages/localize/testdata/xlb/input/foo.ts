import {html} from 'lit-html';
import * as litLocalize from '../../../lit-localize.js';

litLocalize.msg('Hello World!', {id: 'string'});

litLocalize.msg(html`Hello <b><i>World!</i></b>`, {id: 'lit'});

litLocalize.msg((name: string) => `Hello ${name}!`, {
  id: 'variables_1',
  args: ['World'],
});

litLocalize.msg(
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  {
    id: 'lit_variables_1',
    args: ['World', 'https://www.example.com/'],
  }
);

litLocalize.msg((x: string) => html`${x}y${x}y${x}`, {
  id: 'lit_variables_2',
  args: ['x'],
});

litLocalize.msg(
  (x: string) => html`<b>${x}</b>
    <i>y</i>
    <b>${x}</b>
    <i>y</i>
    <b>${x}</b>`,
  {id: 'lit_variables_3', args: ['x']}
);
