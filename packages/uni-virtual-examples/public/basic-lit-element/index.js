import {html, css, LitElement} from 'lit-element';
import 'lit-virtual/src/lit-virtual-scroller.js';

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
            div {
                padding: 1em;
                color: white;
            }
        `;
    }

    render() {
        const { mediumText, color, name } = this.contact;
        return html`
            <div style="background: ${color}">${name}: ${mediumText}</div>
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

    constructor() {
        super();
        this.data = [];
    }

    async firstUpdated() {
        const resp = await fetch('../../shared/contacts.json');
        this.data = await resp.json();
    }

    _contactTemplate(contact) {
        return html`
            <contact-card .contact=${contact}></contact-card>
        `;
    }

    render() {
        return html`
            <lit-virtual-scroller
                layout='vertical'
                .scrollTarget=${window}
                .items=${this.data}
                .template=${this._contactTemplate}>
            </lit-virtual-scroller>
        `;
    }
}

customElements.define('contact-list', ContactList);