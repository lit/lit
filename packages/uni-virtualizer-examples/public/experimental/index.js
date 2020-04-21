import { LitElement, html, css } from 'lit-element';
import { render } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import 'lit-virtualizer/lib/lit-virtualizer.js';

import { Layout1d } from 'lit-virtualizer/lib/uni-virtualizer/lib/layouts/Layout1d.js';


const renderItem = (item) => html`<p>${item.mediumText}</p>`;

class MyExample extends LitElement {
    static get properties() {
        return {
            items: Array
        }
    }

    render() {
        return html`
            <lit-virtualizer
                .items=${this.items}
                .renderItem=${renderItem}
                .layout=${Layout1d}
                .scrollTarget=${window}
            ></lit-virtualizer>
        `;
    }
}

// class MyExample extends LitElement {
//     static get properties() {
//         return {
//             first: Number,
//             last: Number,
//             items: Array,
//             scrollTarget: Object
//         }
//     }

//     constructor() {
//         super();
//         this.first = 0;
//         this.last = -1;
//         this.items = [];
//         this.scrollTarget = window;
//     }

//     _updateRange(e) {
//         this.first = e.first;
//         this.last = e.last;
//     }

//     render() {
//         const { items, first, last, scrollTarget } = this;
//         const itemsToRender = items.slice(first, last + 1);
//         return html`
//             <style>
//                 uni-virtualizer {
//                     position: absolute;
//                     top: 8px;
//                     right: 8px;
//                     bottom: 8px;
//                     left: 8px;
//                     height: unset;
//                 }
//             </style>
//             <uni-virtualizer .scrollTarget=${scrollTarget} .totalItems=${items.length} .layout=${Layout1d} @rangeChanged=${e => this._updateRange(e)}>
//                 ${repeat(itemsToRender, item => item.index, renderItem)}
//             </uni-virtualizer>
//         `;
//     }
// }

customElements.define('my-example', MyExample);

(async function go() {
    const contacts = await(await fetch('../shared/contacts.json')).json();
    render(html`
        <my-example .items=${contacts}></my-example>
    `, document.body);
})();