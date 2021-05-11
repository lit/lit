import { render, html } from 'lit';
import { scroll } from 'lit-virtualizer/lib/scroll.js';
import { Layout1d } from 'lit-virtualizer';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

const example = (contacts) => html`
    <section>
        ${scroll({
            items: contacts,
            renderItem: ({ mediumText }) => html`<p>${mediumText}</p>`,
            layout: Layout1d,
            scrollTarget: window
        })}
    </section>
`;

(async function go() { 
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.body);
    runBenchmarkIfRequested('section');
})();