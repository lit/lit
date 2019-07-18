import { html } from 'lit-html';
import 'lit-virtualizer/lib/lit-virtualizer.js';

const firstVisibleResult = document.querySelector("#first-visible");
const lastVisibleResult = document.querySelector("#last-visible");
const handleRangeChange = (e) => {
    firstVisibleResult.innerHTML = e.firstVisible;
    lastVisibleResult.innerHTML = e.lastVisible;
}

let virtualizer;

(async function go() {
    virtualizer = document.createElement('lit-virtualizer');
    const contacts = await(await fetch('../shared/contacts.json')).json();
    virtualizer.items = contacts;
    virtualizer.renderItem = ({ mediumText }, i) =>
        html`<div style="border-top: 3px solid blue; border-bottom: 3px dashed red; width: 100%;">${i}) ${mediumText}</div>`;
    document.body.appendChild(virtualizer);

    virtualizer.addEventListener("rangechange", handleRangeChange);
})();