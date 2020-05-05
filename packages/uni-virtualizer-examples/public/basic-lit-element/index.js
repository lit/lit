import {html, css, LitElement} from 'lit-element';
import 'lit-virtualizer/lib/lit-virtualizer.js';
import {Layout1d} from 'lit-virtualizer/lit-virtualizer.js';

// import ResizeObserver from 'lit-virtualizer/lib/uni-virtualizer/lib/polyfillLoaders/ResizeObserver.js';

// requestAnimationFrame(async () => {
//     const RO = await ResizeObserver();
//     const ro = new RO((entries) => console.log(entries));
//     ro.observe(document.querySelector('p'));
// });

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
        const { mediumText, color, name } = this.contact || {};
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

    _renderContact(contact) {
        return html`
            <contact-card .contact=${contact}></contact-card>
        `;
    }

    render() {
        // .scrollTarget=${window}
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