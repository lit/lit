import { html } from 'lit-html';
import 'lit-virtualizer/lib/lit-virtualizer.js';

let virtualizer;

(async function go() {
    virtualizer = document.createElement('lit-virtualizer');
    const contacts = await(await fetch('../shared/contacts.json')).json();
    virtualizer.items = contacts;
    virtualizer.template = ({ longText }, i) => html`<p>${i}) ${longText}</p>`;
    document.body.appendChild(virtualizer);

    window.virtualizer = virtualizer;
    window.scrollToIndex = virtualizer.scrollToIndex.bind(virtualizer);
})();