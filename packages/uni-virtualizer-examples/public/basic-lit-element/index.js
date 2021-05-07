import {html, css, LitElement} from 'lit';
import {styleMap} from 'lit/directives/style-map';
import 'lit-virtualizer';
import {Layout1d} from 'lit-virtualizer';

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
                margin: 0.25em 0;
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

class ContactList extends LitElement {
    static get properties() {
        return {
            data: {type: Array}
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

    render() {
        return html`
            <lit-virtualizer
                .layout=${Layout1d}
                .items=${this.data}
                .renderItem=${this._renderContact}>
            </lit-virtualizer>
        `;
    }
}

customElements.define('contact-list', ContactList);