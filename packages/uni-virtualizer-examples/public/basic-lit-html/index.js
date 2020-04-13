import { render, html } from 'lit-html';
// import { scroll } from 'lit-virtualizer/lib/scroll.js';
// import { Layout1d } from 'lit-virtualizer';
import { scroll } from 'lit-virtualizer/lib/lit-virtualizer-experimental.js';
import { Layout1d } from 'lit-virtualizer/lib/uni-virtualizer/lib/layouts/Layout1d.js';

const urlParams = new URLSearchParams(window.location.search);
urlParams.set('useShadowDOM', urlParams.get('useShadowDOM') === 'true');
const useShadowDOM = urlParams.get('useShadowDOM') === 'true';
window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);

const example = (contacts) => html`
    <section>
        ${scroll({
            items: contacts,
            renderItem: ({ mediumText }) => html`<p>${mediumText}</p>`,
            layout: Layout1d,
            scrollTarget: window,
            useShadowDOM: useShadowDOM
        })}
    </section>
`;

(async function go() {
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(example(contacts), document.body);
})();