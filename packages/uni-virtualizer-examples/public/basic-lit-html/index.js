import { render, html } from 'lit-html';
import { scroll } from 'lit-virtualizer/lib/scroll.js';

const example = (contacts) => html`
    <section>
        ${scroll({
            items: contacts,
            renderItem: ({ mediumText }) => html`<p>${mediumText}</p>`,
            scrollTarget: window,
            useShadowDOM: false
        })}
    </section>
`;

(async function go() {
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.body);
})();