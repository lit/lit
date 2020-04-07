import { html } from 'lit-html';
// import { Layout1d } from 'lit-virtualizer/lit-virtualizer.js';
// import 'lit-virtualizer/lit-virtualizer.js';
import 'lit-virtualizer/lib/lit-virtualizer-experimental.js';
import {Layout1d} from 'lit-virtualizer/lib/uni-virtualizer/lib/layouts/Layout1d.js';

let virtualizer;

(async function go() {
    virtualizer = document.createElement('lit-virtualizer');
    const contacts = await(await fetch('../shared/contacts.json')).json();
    virtualizer.items = contacts;
    virtualizer.layout = Layout1d;
    virtualizer.keyFunction = item => item.index;
    virtualizer.renderItem = ({ longText, index }) => html`<p>${index}) ${longText}</p>`;
    document.body.appendChild(virtualizer);

    window.virtualizer = virtualizer;
    window.scrollToIndex = virtualizer.scrollToIndex.bind(virtualizer);
})();