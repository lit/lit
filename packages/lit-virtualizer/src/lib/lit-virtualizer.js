import { html, css, LitElement } from 'lit-element';
import { scroll } from './scroll.js';

export class LitVirtualizer extends LitElement {
    static get properties() {
        return {
            items: {},
            template: {},
            scrollTarget: {} 
        }
    }

    constructor() {
        super();
        this.items = [1, 2, 3];
        this.template = (item, idx) => html`<div>${idx}: ${item}</div>`;
        this.renderRoot = this;
    }

    get template() {
        return this._template;
    }

    set template(template) {
        if (template !== this.template) {
            this._template = template;
            this.requestUpdate();
        }
    }

    firstUpdated() {
    }

    render() {
        return html`${scroll({
            items: this.items,
            template: this._template,
            scrollTarget: this.scrollTarget,
            useShadowDOM: true
        })}`;
    }
}

customElements.define('lit-virtualizer', LitVirtualizer);