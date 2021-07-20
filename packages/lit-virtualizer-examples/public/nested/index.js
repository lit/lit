import { LitElement, html, css } from "lit";
// import { classMap } from 'lit/directives/class-map.js';
import '@lit-labs/virtualizer';
// import { flow } from '@lit-labs/virtualizer/layouts/FlowLayout.js';
// import { scrollerRef } from '@lit-labs/virtualizer/VirtualScroller.js';
// import { getPhotos, getUrl } from "../../lib/flickr";
import { runBenchmarkIfRequested } from '../../lib/benchmark.js';


export class NestTest extends LitElement {
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
                font-family: sans-serif;
            }

            lit-virtualizer {
                flex: 1;
            }


            h3 {
                background: midnightblue;
                color: white;
                height: 3em;
                line-height: 3em;
                margin: 0;
                padding: 0 1em;
                top: 0;
                width: 100%;
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
        this.renderNested = this.renderNested.bind(this);
    }

    get scroller() {
        return this.shadowRoot.querySelector('lit-virtualizer')[scrollerRef];
    }

    render() {
        return html`
            <lit-virtualizer
                .items=${this.data}
                .renderItem=${this.renderNested}
            ></lit-virtualizer>
        `;
    }

    async firstUpdated() {
        const resp = await fetch('../shared/contacts.json');
        const rawData = (await resp.json()).sort((a, b) => a.last < b.last ? -1 : 1);
        const data = [];
        data.push(rawData.slice(0, 30));
        data.push(rawData.slice(30, 60));
        data.push(rawData.slice(60, 90));
        this.data = data;
        this.v = this.shadowRoot.querySelector('lit-virtualizer');
        runBenchmarkIfRequested(this.shadowRoot.querySelector('lit-virtualizer'));
    }

    renderItem({ first, last, label }) {
        return label
            ? html`<h3>${label}</h3>`
            : html`<p>${first} ${last}</p>`;
    }

    renderNested(data, idx) {
        return html`
            <lit-virtualizer id=${idx} style="min-height: 100vh; width: 100%;"
                .scrollTarget=${this.v}
                .items=${data}
                .renderItem=${this.renderItem}
            ></lit-virtualizer>
        `;
    }
}

customElements.define('nest-test', NestTest);