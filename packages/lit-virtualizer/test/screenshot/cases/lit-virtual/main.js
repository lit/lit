import '../../../../lit-virtualizer.js'
import { html } from 'lit-html';

(async function go() {
  const contacts = await(await fetch('../../shared/contacts.json')).json();

  const virtualizer = document.createElement('lit-virtualizer');
  virtualizer.items = contacts;
  virtualizer.template = ({ mediumText }) => html`<p>${mediumText}</p>`;

  document.body.appendChild(virtualizer);
})();