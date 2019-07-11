import { scroll } from '../../../../lit-virtualizer.js'
import { html, render } from 'lit-html';

(async function go() {
  const contacts = await(await fetch('../../shared/contacts.json')).json();

  const urlParams = new URLSearchParams(window.location.search);
  const index = Number(urlParams.get('index')) || undefined;
  const position = urlParams.get('position') || undefined;

  const virtualized = html`<div id="main">
    ${scroll({
      items: contacts,
      template: ({ mediumText }, i) => html`<p>${i}) ${mediumText}</p>`,
      scrollToIndex: { index, position },
    })}
  </div>`;

  render(virtualized, document.body);
})();