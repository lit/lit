import { html } from 'lit';
import '@lit-labs/virtualizer';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

let virtualizer;

(async function go() {
    virtualizer = document.createElement('lit-virtualizer');
    const contacts = await(await fetch('../shared/contacts.json')).json();
    virtualizer.items = contacts;
    virtualizer.renderItem = function (item, index) {
        return html`<p>${item.index}) ${item.longText}</p>`;
    }
    virtualizer.keyFunction = ({index}) => index;
    document.body.appendChild(virtualizer);

    window.virtualizer = virtualizer;
    window.scrollToIndex = virtualizer.scrollToIndex.bind(virtualizer);

    runBenchmarkIfRequested(virtualizer);
})();