import { html, LitElement } from 'lit-element';
import { customElement } from 'lit-element/lib/decorators/customElement';
import { property } from 'lit-element/lib/decorators/property';
import { TemplateResult } from 'lit-html';
import { scroll } from './scroll.js';
import { scrollerRef } from './uni-virtualizer/lib/VirtualScroller.js';
import { Type, Layout, LayoutConfig } from './uni-virtualizer/lib/layouts/Layout.js';

/**
 * A LitElement wrapper of the scroll directive.
 *
 * Import this module to declare the lit-virtualizer custom element.
 * Pass an items array, renderItem method, and scroll target as properties
 * to the <lit-virtualizer> element.
 */
@customElement('lit-virtualizer')
export class LitVirtualizer<Item> extends LitElement {
    @property()
    renderItem: (item: Item, index?: number) => TemplateResult;

    @property()
    items: Array<Item>;

    @property()
    scrollTarget: Element | Window = this;

    @property()
    keyFunction: (item:any) => any;

    private _layout: Layout | Type<Layout> | LayoutConfig

    private _scrollToIndex: {index: number, position: string};
  
    createRenderRoot() {
        return this;
    }

    // get items() {
    //     return this._items;
    // }

    // set items(items) {
    //     this._items = items;
    //     this._scroller.totalItems = items.length;
    // }

    /**
     * The method used for rendering each item.
     */
    // get renderItem() {
    //     return this._renderItem;
    // }
    // set renderItem(renderItem) {
    //     if (renderItem !== this.renderItem) {
    //         this._renderItem = renderItem;
    //         this.requestUpdate();
    //     }
    // }

    @property()
    set layout(layout: Layout | Type<Layout> | LayoutConfig) {
        // TODO (graynorton): Shouldn't have to set this here
        this._layout = layout;
        this.requestUpdate();
    }

    get layout() {
        return this[scrollerRef]!.layout;
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
        const { items, renderItem, keyFunction, scrollTarget } = this;
        const layout = this._layout;
        return html`
            ${scroll({ items, renderItem, layout, keyFunction, scrollTarget, scrollToIndex: this._scrollToIndex })}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'lit-virtualizer': LitVirtualizer<unknown>;
    }
}