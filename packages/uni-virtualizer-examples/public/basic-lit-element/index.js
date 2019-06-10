import {html, css, LitElement} from 'lit-element';
import 'lit-virtualizer/lib/lit-virtualizer.js';

class ContactCard extends LitElement {
    static get properties() {
        return {
            contact: {type: Object}
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
            }
        `;
    }

    render() {
        const { mediumText, color, name } = this.contact;
        // return html`
        //     <div style="background: ${color}">${name}: ${mediumText}</div>
        // `;
        return html`
            <details style="background: ${color}">
                <summary>${name}</summary>
                <p>${mediumText}</p>
            </details>
        `;
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
    }

    _contactTemplate(contact) {
        return html`
            <contact-card .contact=${contact}></contact-card>
        `;
    }

    render() {
        // .scrollTarget=${window}
        return html`
            <lit-virtualizer
                layout='vertical'
                .items=${this.data}
                .template=${this._contactTemplate}>
            </lit-virtualizer>
        `;
    }
}

customElements.define('contact-list', ContactList);