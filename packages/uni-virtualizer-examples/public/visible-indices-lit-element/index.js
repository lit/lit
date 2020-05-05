import { html } from 'lit-html';
import 'lit-virtualizer/lib/lit-virtualizer.js';
import { Layout1d } from 'lit-virtualizer/lit-virtualizer.js';

const firstVisibleResult = document.querySelector("#first-visible");
const lastVisibleResult = document.querySelector("#last-visible");
const handleVisibilityChange = (e) => {
    firstVisibleResult.innerHTML = e.firstVisible;
    lastVisibleResult.innerHTML = e.lastVisible;
}

let virtualizer;

(async function go() {
    virtualizer = document.createElement('lit-virtualizer');
    const contacts = await(await fetch('../shared/contacts.json')).json();
    virtualizer.items = contacts;
    virtualizer.layout = Layout1d;
    virtualizer.renderItem = ({ mediumText, index }) =>
        html`<div style="border-top: 3px solid blue; border-bottom: 3px dashed red; width: 100%;">${index}) ${mediumText}</div>`;
    document.body.appendChild(virtualizer);

    virtualizer.addEventListener("visibilityChanged", handleVisibilityChange);
})();