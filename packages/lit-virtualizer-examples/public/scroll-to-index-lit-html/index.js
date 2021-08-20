import { render, html } from 'lit';
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

const example = (contacts, scrollToIndex = null) => html`
    ${virtualize({
        scroll: true,
        items: contacts,
        renderItem: ({ longText, index }) => html`<p>${index}) ${longText}</p>`,
        scrollToIndex: scrollToIndex
    })}
`;

let contacts;

(async function go() {
    contacts = await(await fetch('../shared/contacts.json')).json();
    const container = document.getElementById('container');
    render(example(contacts), container);
    runBenchmarkIfRequested(container);
})();

window.scrollToIndex = (index, position) => {
    render(example(contacts, {index, position}), document.getElementById("container"));
}