import { render, html } from 'lit';
import { scroll } from '@lit-labs/virtualizer/lib/scroll.js';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

const example = (contacts) => html`
    <section>
        ${scroll({
            items: contacts,
            renderItem: ({ mediumText }) => html`<p>${mediumText}</p>`,
            scrollTarget: window
        })}
    </section>
`;

(async function go() { 
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.body);
    runBenchmarkIfRequested('section');
})();