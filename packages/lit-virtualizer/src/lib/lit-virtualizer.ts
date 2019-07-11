import { html, LitElement, customElement, property, TemplateResult } from 'lit-element';
import { scroll } from './scroll';

/**
 * A LitElement wrapper of the scroll directive.
 * 
 * Import this module to declare the lit-virtualizer custom element.
 * Pass an items array, template, and scroll target as properties to the
 * <lit-virtualizer> element.
 */
@customElement('lit-virtualizer')
export class LitVirtualizer extends LitElement {
    @property()
    _template: (item: any, index?: number) => TemplateResult;

    @property()
    items: Array<any>;

    @property()
    scrollTarget: Element | Window;

    private _scrollToIndex: {index: number, position: string};

    constructor() {
        super();
        (this as {renderRoot: Element | DocumentFragment}).renderRoot = this;
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

    /**
     * Scroll to the specified index, placing that item at the given position
     * in the scroll view.
     */
    async scrollToIndex(index: number, position: string = 'start') {
        this._scrollToIndex = {index, position}
        this.requestUpdate()
        await this.updateComplete
        this._scrollToIndex = null
    }

    render(): TemplateResult {
        return html`${scroll({
            items: this.items,
            template: this._template,
            scrollTarget: this.scrollTarget,
            scrollToIndex: this._scrollToIndex,
            // TODO: enable this flag.
            useShadowDOM: true
            // TODO: allow configuration of a layout.
        })}`;
    }
}