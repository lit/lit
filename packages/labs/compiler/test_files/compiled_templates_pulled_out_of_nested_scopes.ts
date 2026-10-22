import {html, nothing} from 'lit-html';

function outside() {
  function inner() {
    if (true as boolean) {
      return html`<p>Hi</p>`;
    }
    return nothing;
  }
  return inner();
}
