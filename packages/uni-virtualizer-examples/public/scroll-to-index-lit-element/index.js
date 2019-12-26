import { html } from 'lit-html';
import { Layout1d } from 'lit-virtualizer/lit-virtualizer.js';
import 'lit-virtualizer/lit-virtualizer.js';

let virtualizer;

(async function go() {
    virtualizer = document.createElement('lit-virtualizer');
    const contacts = await(await fetch('../shared/contacts.json')).json();
    virtualizer.items = contacts;
    virtualizer.layout = Layout1d;
    virtualizer.renderItem = ({ longText }, i) => html`<p>${i}) ${longText}</p>`;
    document.body.appendChild(virtualizer);

    window.virtualizer = virtualizer;
    window.scrollToIndex = virtualizer.scrollToIndex.bind(virtualizer);
})();