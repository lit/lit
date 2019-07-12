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

            div {
                padding: 1em;
                background: #DDD;
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

class WrappedContact extends LitElement {
    static get properties() {
        return {
            contact: {type: Object}
        };
    }

    static get styles() {
        return css`
            div {
                border: 2px solid red;
            }
        `;
    }

    render() {
        const { contact } = this;
        return html`<div>
            <contact-card .contact=${contact}></contact-card>
        </div>`;
    }
}

customElements.define('wrapped-contact', WrappedContact);

class Yo extends LitElement {
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
        const resp = await fetch('../shared/contacts.json');
        this.data = await resp.json();
    }

    render() {
        // return html`
        //         <lit-virtualizer
        //             .items=${this.data}
        //             .template=${({ mediumText, color }) => html`
        //                 <div
        //                     style="background: ${color}; color: white; padding: 1em; margin: 0.25em 0;"
        //                 >
        //                     ${mediumText}
        //                 </div>
        //             `}>
        //         </lit-virtualizer>
        // `;
        return html`
            <lit-virtualizer
                layout='vertical'
                .scrollTarget=${window}
                .items=${this.data}
                .renderItem=${contact => html`
                    <wrapped-contact .contact=${contact}></wrapped-contact>
                `}>
            </lit-virtualizer>
        `;
}
}

customElements.define('hey-yo', Yo);