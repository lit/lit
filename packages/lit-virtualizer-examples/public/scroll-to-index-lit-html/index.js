import { render, html } from 'lit';
import { scroll } from '@lit-labs/virtualizer/scroll.js';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

const example = (contacts, scrollToIndex = null) => html`
    <section style="height: 100%;">
        ${scroll({
            items: contacts,
            renderItem: ({ longText, index }) => html`<p>${index}) ${longText}</p>`,
            scrollToIndex: scrollToIndex,
        })}
    </section>
`;

let contacts;

(async function go() {
    contacts = await(await fetch('../shared/contacts.json')).json();
    const container = document.getElementById('container');
    render(example(contacts), container);
    runBenchmarkIfRequested('#container > section');
})();

window.scrollToIndex = (index, position) => {
    render(example(contacts, {index, position}), document.getElementById("container"));
}