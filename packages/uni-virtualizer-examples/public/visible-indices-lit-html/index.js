import { render, html } from 'lit-html';
import { scroll } from 'lit-virtualizer/lib/scroll.js';


const firstVisibleResult = document.querySelector("#first-visible");
const lastVisibleResult = document.querySelector("#last-visible");
const handleRangeChange = (e) => {
    firstVisibleResult.innerHTML = e.firstVisible;
    lastVisibleResult.innerHTML = e.lastVisible;
}

const example = (contacts) => html`
    <section @rangechange=${handleRangeChange} style="height: 100%;">
        ${scroll({
            items: contacts,
            renderItem: ({ mediumText }, i) =>
                html`<div style="border-top: 3px solid blue; border-bottom: 3px dashed red; width: 100%;">${i}) ${mediumText}</div>`,
            useShadowDOM: true
        })}
    </section>
`;

(async function go() {
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.querySelector("#container"));
})();