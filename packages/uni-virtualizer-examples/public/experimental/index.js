import { LitElement, html } from 'lit-element';
import { render } from 'lit-html';
import 'lit-virtualizer/lib/uni-virtualizer/lib/Experimental.js';
import { SmartObject } from 'lit-virtualizer/lib/uni-virtualizer/lib/Experimental.js';
// import { scroll } from 'lit-virtualizer/lib/scroll.js';
// import { Layout1d } from 'lit-virtualizer';

let smartObj = new SmartObject();
setTimeout(() => smartObj.interact(), 1000);

const items = [];
const n = 100;
for (let i = 0; i < n; i++) {
    items[i] = i;
}
const renderItem = (item) => html`<p>${item.mediumText}</p>`;

class MyExample extends LitElement {
    static get properties() {
        return {
            first: Number,
            last: Number,
            items: Array    
        }
    }

    constructor() {
        super();
        this.first = 0;
        this.last = 9;
        this.items = [];
    }

    _updateRange(e) {
        Object.assign(this, e.detail);
    }

    render() {
        return html`
            <uni-virtualizer @rangeChanged=${e => this._updateRange(e)}>
                ${this.items.slice(this.first, this.last + 1).map(item => renderItem(item))}
            </uni-virtualizer>
        `;
    }
}

customElements.define('my-example', MyExample);

(async function go() {
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(html`
        <my-example .items=${contacts}></my-example>
    `, document.body);
})();

// const urlParams = new URLSearchParams(window.location.search);
// urlParams.set('useShadowDOM', urlParams.get('useShadowDOM') === 'true');
// const useShadowDOM = urlParams.get('useShadowDOM') === 'true';
// window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);

// const example = (contacts) => html`
//     <section>
//         ${scroll({
//             items: contacts,
//             renderItem: ({ mediumText }) => html`<p>${mediumText}</p>`,
//             layout: Layout1d,
//             scrollTarget: window,
//             useShadowDOM: useShadowDOM
//         })}
//     </section>
// `;

// (async function go() {
//     const contacts = await(await fetch('../shared/contacts.json')).json();
//     render(example(contacts), document.body);
// })();