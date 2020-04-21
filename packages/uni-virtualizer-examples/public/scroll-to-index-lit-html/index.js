import { render, html } from 'lit-html';
import { scroll } from 'lit-virtualizer/lib/scroll.js';
import { Layout1d } from 'lit-virtualizer';

const example = (contacts, scrollToIndex = null) => html`
    <section style="height: 100%;">
        ${scroll({
            items: contacts,
            layout: Layout1d,
            renderItem: ({ longText, index }) => html`<p>${index}) ${longText}</p>`,
            scrollToIndex: scrollToIndex,
        })}
    </section>
`;

let contacts;

(async function go() {
    contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.getElementById("container"));
})();

window.scrollToIndex = (index, position) => {
    render(example(contacts, {index, position}), document.getElementById("container"));
}