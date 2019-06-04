import { html, css, LitElement } from 'lit-element';
import { scroll } from './scroll.js';

class LitVirtualScroller extends LitElement {
    static get properties() {
        return {
            items: {},
            template: {},
            scrollTarget: {} 
        }
    }

    // static get styles() {
    //     return css`
    //         :host {
    //             display: block;
    //             position: relative;
    //             contain: strict;
    //             height: 150px;
    //             overflow: auto;
    //         }
    //         :host([hidden]) {
    //             display: none;
    //         }
    //         ::slotted(*) {
    //             box-sizing: border-box;
    //         }
    //         :host([layout=vertical]) ::slotted(*) {
    //             width: 100%;
    //         }
    //         :host([layout=horizontal]) ::slotted(*) {
    //             height: 100%;
    //         }
    //     `;
    // }

    constructor() {
        super();
        this.items = [1, 2, 3];
        this.template = (item, idx) => html`<div>${idx}: ${item}</div>`;
        this.renderRoot = this;
        // this.shadowRoot.appendChild(document.createElement('slot'));
        // const ss = document.createElement('style');
        // ss.textContent = `
        //     :host {
        //         display: block;
        //         position: relative;
        //         contain: strict;
        //         height: 150px;
        //         overflow: auto;
        //     }
        //     :host([hidden]) {
        //         display: none;
        //     }
        //     ::slotted(*) {
        //         box-sizing: border-box;
        //     }
        //     :host([layout=vertical]) ::slotted(*) {
        //         width: 100%;
        //     }
        //     :host([layout=horizontal]) ::slotted(*) {
        //         height: 100%;
        //     }
        // `;
        // this.shadowRoot.appendChild(ss);
    }

    get template() {
        return this._template;
    }

    set template(template) {
        if (template !== this.template) {
            this._template = template;
            // this._internalTemplate = idx => template(this.items[idx], idx);
            this.requestUpdate();
        }
    }

    firstUpdated() {
    }

    render() {
        return html`${scroll({
            // container: this.renderRoot,
            // scrollTarget: this,
            items: this.items,
            template: this._template,
            scrollTarget: this.scrollTarget,
            useShadowDOM: true
        })}`;
    }
}

customElements.define('lit-virtual-scroller', LitVirtualScroller);