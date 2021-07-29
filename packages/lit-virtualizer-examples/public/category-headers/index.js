import { LitElement, html, css } from "lit";
// import { classMap } from 'lit/directives/class-map.js';
import '@lit-labs/virtualizer';
// import { flow } from '@lit-labs/virtualizer/layouts/FlowLayout.js';
// import { scrollerRef } from '@lit-labs/virtualizer/VirtualScroller.js';
// import { getPhotos, getUrl } from "../../lib/flickr";
import { runBenchmarkIfRequested } from '../../lib/benchmark.js';


export class ContactList extends LitElement {
    static get properties() {
        return {
            data: { state: true }
        }
    }

    static get styles() {
        return css`
            :host {
                display: flex;
                flex-direction: column;
            }

            lit-virtualizer {
                flex: 1;
            }

            div {
                width: 100%;
                margin-bottom: 1em;
                font-family: sans-serif;
            }
            h3 {
                background: midnightblue;
                color: white;
                height: 3em;
                line-height: 3em;
                margin: 0 0 1.5em 0;
                padding: 0 1em;
                top: 0;
            }
            p {
                margin: 0.5em 0.5em 0.5em 1em;
            }
        `;
    }

    constructor() {
        super();
        this.data = [];
        this.renderItem = this.renderItem.bind(this);
    }

    get scroller() {
        return this.shadowRoot.querySelector('lit-virtualizer')[scrollerRef];
    }

    render() {
        return html`
            <lit-virtualizer
                scroller
                .items=${this.data}
                .renderItem=${this.renderItem}
            ></lit-virtualizer>
        `;
    }

    async firstUpdated() {
        const resp = await fetch('../shared/contacts.json');
        this.data = (await resp.json()).sort((a, b) => a.last < b.last ? -1 : 1);
        runBenchmarkIfRequested(this.shadowRoot.querySelector('lit-virtualizer'));
    }

    renderItem({ first, last }, idx) {
        const prev = this.data[idx - 1];
        const showHeader = !prev || prev.last[0] !== last[0];
        return html`
            <div>
                ${showHeader
                    ? html`<h3>${last[0]}</h3>`
                    : null
                }
                <p>${first} ${last}</p>
            </div>
        `;
    }
}

customElements.define('contact-list', ContactList);