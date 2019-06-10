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
        this.renderRoot = this;
    }

    /**
     * The template used for rendering each item.
     */
    get template() {
        return this._template;
    }
    set template(template) {
        if (template !== this.template) {
            this._template = template;
            this.requestUpdate();
        }
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