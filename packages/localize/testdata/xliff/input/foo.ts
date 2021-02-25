import {html} from 'lit-html';
import {msg, str} from '../../../lit-localize.js';

const user = 'Friend';
const url = 'https://www.example.com/';

// Plain string
msg('Hello World!');

// Plain string with expression
msg(str`Hello ${user}!`);

// Lit template
msg(html`Hello <b>World</b>!`);

// Lit template with variable expression (one placeholder)
msg(html`Hello <b>${user}</b>!`);

// Lit template with variable expression (two placeholders)
msg(html`Click <a href=${url}>here</a>!`);

// Lit template with string expression
//
// TODO(aomarks) The "SALT" text is here because we have a check to make sure
// that two messages can't have the same ID unless they have identical template
// contents. After https://github.com/Polymer/lit-html/issues/1621 is
// implemented, add a "meaning" parameter instead.
msg(html`[SALT] Click <a href="${'https://www.example.com/'}">here</a>!`);

// Lit template with nested msg expression
msg(html`[SALT] Hello <b>${msg('World')}</b>!`);

// Lit template with comment
msg(html`Hello <b><!-- comment -->World</b>!`);

// Lit template with expression order inversion
msg(html`a:${"A"} b:${"B"} c:${"C"}`);

// Custom ID
msg('Hello World', {id: 'myId'});

// msgdesc: Description of 0
msg('described 0');

// msgdesc: Parent description
export function described() {
  // msgdesc: Description of 1
  msg('described 1');
  // msgdesc: Description of 2
  msg('described 2');
}
