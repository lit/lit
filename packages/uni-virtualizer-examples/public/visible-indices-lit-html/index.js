import { render, html } from 'lit-html';
// import { scroll } from 'lit-virtualizer/lib/scroll.js';
// import { Layout1d } from 'lit-virtualizer';
import { scroll } from 'lit-virtualizer/lib/lit-virtualizer-experimental.js';
import { Layout1d } from 'lit-virtualizer/lib/uni-virtualizer/lib/layouts/Layout1d.js';

const firstVisibleResult = document.querySelector("#first-visible");
const lastVisibleResult = document.querySelector("#last-visible");
const handleRangeChange = (e) => {
    firstVisibleResult.innerHTML = e.firstVisible;
    lastVisibleResult.innerHTML = e.lastVisible;
}

const example = (contacts) => html`
    <section @rangeChanged=${handleRangeChange} style="height: 100%;">
        ${scroll({
            items: contacts,
            layout: Layout1d,
            keyFunction: item => item.index,
            renderItem: ({ mediumText, index }) =>
                html`<div style="border-top: 3px solid blue; border-bottom: 3px dashed red; width: 100%;">${index}) ${mediumText}</div>`,
            useShadowDOM: true
        })}
    </section>
`;

(async function go() {
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.querySelector("#container"));
})();