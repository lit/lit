import { html } from 'lit';
import '@lit-labs/virtualizer';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

const firstVisibleResult = document.querySelector("#first-visible");
const lastVisibleResult = document.querySelector("#last-visible");
const handleVisibilityChange = (e) => {
    firstVisibleResult.innerHTML = e.first;
    lastVisibleResult.innerHTML = e.last;
}

let virtualizer;

(async function go() {
    virtualizer = document.createElement('lit-virtualizer');
    virtualizer.setAttribute('scroller', true);
    const contacts = await(await fetch('../shared/contacts.json')).json();
    virtualizer.items = contacts;
    virtualizer.renderItem = ({ mediumText, index }) =>
        html`<div style="border-top: 3px solid blue; border-bottom: 3px dashed red; width: 100%;">${index}) ${mediumText}</div>`;

    virtualizer.addEventListener("visibilityChanged", handleVisibilityChange);
    document.body.appendChild(virtualizer);

    runBenchmarkIfRequested(virtualizer);
})();