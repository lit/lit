import { scroll } from '../../../../lit-virtualizer.js'
import { html, render } from 'lit-html';

(async function go() {
  const contacts = await(await fetch('../../shared/contacts.json')).json();

  const virtualized = html`<div id="main">
    ${scroll({
      items: contacts,
      template: ({ mediumText }) => html`<p>${mediumText}</p>`
    })}
  </div>`;

  render(virtualized, document.body);
})();