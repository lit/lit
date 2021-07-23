import { LitElement, html, css } from "lit";
// import { classMap } from 'lit/directives/class-map.js';
import '@lit-labs/virtualizer';
// import { flow } from '@lit-labs/virtualizer/layouts/FlowLayout.js';
// import { scrollerRef } from '@lit-labs/virtualizer/VirtualScroller.js';
// import { getPhotos, getUrl } from "../../lib/flickr";
import { runBenchmarkIfRequested } from '../../lib/benchmark.js';


export class MyExample extends LitElement {
    static get properties() {
        return {
            data: { state: true }
        }
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 300px;
                height: 600px;
                resize: both;
                overflow: auto;
            }

            p {
                margin: 2em 1em;
                width: calc(100% - 2em);
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
                .items=${this.data}
                .renderItem=${this.renderItem}
                .scrollTarget=${this}
            ></lit-virtualizer>
        `;
    }

    async firstUpdated() {
        const resp = await fetch('../shared/contacts.json');
        this.data = (await resp.json()).sort((a, b) => a.last < b.last ? -1 : 1);
        runBenchmarkIfRequested(this.shadowRoot.querySelector('lit-virtualizer'));
    }

    renderItem({ first, last, label }) {
        return label
            ? html`<h3>${label}</h3>`
            : html`<p>${first} ${last}</p>`;
    }
}

customElements.define('my-example', MyExample);