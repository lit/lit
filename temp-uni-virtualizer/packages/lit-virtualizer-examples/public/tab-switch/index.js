import {html, css, LitElement} from 'lit';
import {styleMap} from 'lit/directives/style-map';
import {cache} from 'lit/directives/cache';
import '@lit-labs/virtualizer';

// import {FlowLayout} from '@lit-labs/virtualizer';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

class ContactCard extends LitElement {
    static get properties() {
        return {
            contact: {type: Object},
            open: {type: Boolean}
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
                margin: 0.5em 0;
            }
            div, details {
                padding: 1em;
                color: white;
                display: block;
            }
        `;
    }

    constructor() {
        super();
        this.open = false;
        this._details = 'HTMLDetailsElement' in window;
    }

    render() {
        const { mediumText, color, name } = this.contact || {};
        return html`
            <details style="background: ${color}">
                <summary @click=${this._handleSummaryClick}>${name}</summary>
                <p style=${styleMap(this._summaryStyle())}>${mediumText}</p>
            </details>
        `;
    }

    _summaryStyle() {
        return (!this._details && !this.open) ? { display: 'none' } : { display: 'block' };
    }

    _handleSummaryClick() {
        if (!this._details) {
            this.open = !this.open;
        }
    }
}

customElements.define('contact-card', ContactCard);

function switchy(val, cases) {
    return cases[val];
}

class ContactList extends LitElement {
    static get properties() {
        return {
            data: {type: Array},
            tab: {type: Number},
            scrollPositions: {type: Map}
        };
    }

    static get styles() {
        return css`
        :host {
            display: block;
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
        }
        lit-virtualizer {
            height: 100%;
        }
        `
    }

    constructor() {
        super();
        this.data = [];
        this.tab = 0;
        this.scrollPositions = new Map();
    }

    async firstUpdated() {
        const resp = await fetch('../shared/contacts.json');
        this.data = await resp.json();
        runBenchmarkIfRequested(this.shadowRoot.querySelector('lit-virtualizer'));
    }

    _renderContact(contact) {
        return html`
            <contact-card .contact=${contact}></contact-card>
        `;
    }

    willUpdate(changed) {
        if (changed.has('tab')) {
            const prevTab = changed.get('tab');
            const v = this.shadowRoot.querySelector('lit-virtualizer');
            if (v) {
                this.scrollPositions.set(prevTab, v.scrollTop);
            }
        }
    }

    updated(changed) {
        if (changed.has('tab')) {
            const v = this.shadowRoot.querySelector('lit-virtualizer');
            v.scrollTop = this.scrollPositions.get(this.tab);
        }
    }

    render() {
        return html`
            <button @click=${this.chooseTab}>0</button>
            <button @click=${this.chooseTab}>1</button>
            ${
                cache(switchy(this.tab, {
                    0: html`
                        <lit-virtualizer scroller
                            .items=${this.data}
                            .renderItem=${({mediumText}) => html`<p>${mediumText}</p>`}>
                        </lit-virtualizer>
                    `,
                    1: html`
                        <lit-virtualizer scroller
                            .items=${this.data}
                            .renderItem=${this._renderContact}>
                        </lit-virtualizer>
                    `
                }))
            }
        `;
    }

    chooseTab(evt) {
        this.tab = Number(evt.target.textContent);
    }
}

window.html = html;

customElements.define('contact-list', ContactList);