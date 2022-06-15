import { render, html } from 'lit';
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

const example = (contacts) => html`
        ${virtualize({
            items: contacts,
            renderItem: ({ mediumText }) => html`<p>${mediumText}</p>`
        })}
`;

(async function go() { 
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.body);
    runBenchmarkIfRequested(document.body);
})();