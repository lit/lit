import { html, LitElement, customElement, property, TemplateResult } from 'lit-element';
import { scroll } from './scroll.js';
import { Type, Layout } from './uni-virtualizer/lib/layouts/Layout.js';

/**
 * A LitElement wrapper of the scroll directive.
 *
 * Import this module to declare the lit-virtualizer custom element.
 * Pass an items array, renderItem method, and scroll target as properties
 * to the <lit-virtualizer> element.
 */
@customElement('lit-virtualizer')
export class LitVirtualizer<T> extends LitElement {
    @property()
    private _renderItem: (item: T, index?: number) => TemplateResult;

    @property()
    items: Array<T>;

    @property()
    scrollTarget: Element | Window;

    @property()
    layout: Type<Layout>

    private _scrollToIndex: {index: number, position: string};

    createRenderRoot() {
        return this;
    }

    /**
     * The method used for rendering each item.
     */
    get renderItem() {
        return this._renderItem;
    }
    set renderItem(renderItem) {
        if (renderItem !== this.renderItem) {
            this._renderItem = renderItem;
            this.requestUpdate();
        }
    }

    /**
     * Scroll to the specified index, placing that item at the given position
     * in the scroll view.
     */
    async scrollToIndex(index: number, position: string = 'start') {
        this._scrollToIndex = {index, position};
        this.requestUpdate();
        await this.updateComplete;
        this._scrollToIndex = null;
    }

    render(): TemplateResult {
        return html`${scroll({
            items: this.items,
            renderItem: this._renderItem,
            layout: this.layout,
            scrollTarget: this.scrollTarget,
            scrollToIndex: this._scrollToIndex
            // TODO: allow configuration of a layout.
        })}`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'lit-virtualizer': LitVirtualizer<unknown>;
    }
}
