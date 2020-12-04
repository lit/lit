import {html} from 'lit-html';
import {msg} from '../../../lit-localize.js';

msg('Hello World!', {id: 'string'});

msg(html`Hello <b><i>World!</i></b>`, {id: 'lit'});

msg((name: string) => `Hello ${name}!`, {id: 'variables_1', args: ['World']});

msg(
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  {id: 'lit_variables_1', args: ['World', 'https://www.example.com/']}
);

msg((x: string) => html`${x}y${x}y${x}`, {id: 'lit_variables_2', args: ['x']});

msg(
  (x: string) => html`<b>${x}</b>
    <i>y</i>
    <b>${x}</b>
    <i>y</i>
    <b>${x}</b>`,
  {id: 'lit_variables_3', args: ['x']}
);

msg(html`Hello <b><!-- comment -->World!</b>`, {id: 'comment'});
