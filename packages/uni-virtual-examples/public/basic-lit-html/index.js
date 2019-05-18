import { render, html } from 'lit-html';
import { scroll } from 'lit-virtual/src/scroll.js';

const example = (contacts) => html`
    <div>
        ${scroll({
            items: contacts,
            template: ({ mediumText }) => html`<p>${mediumText}</p>`,
            scrollTarget: window
        })}
    </div>
`;

(async function go() {
    const contacts = await(await fetch('../../shared/contacts.json')).json();
    render(example(contacts), document.body);
})();