import { html, LitElement, customElement, property } from 'lit-element';
import { TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { Type, Layout, LayoutConfig } from './uni-virtualizer/lib/layouts/Layout.js';
import { VirtualScroller, RangeChangeEvent } from './uni-virtualizer/lib/VirtualScroller.js';


/**
 * A LitElement wrapper of the scroll directive.
 *
 * Import this module to declare the lit-virtualizer custom element.
 * Pass an items array, renderItem method, and scroll target as properties
 * to the <lit-virtualizer> element.
 */
@customElement('lit-virtualizer')
export class LitVirtualizer<Item, Child extends HTMLElement> extends LitElement {
    @property()
    private _renderItem: (item: Item, index?: number) => TemplateResult;

    @property()
    private _first: number = 0;

    @property()
    private _last: number = -1;

    @property()
    private _items: Array<Item>;

    private _scroller: VirtualScroller<Item, Child> = null;

    @property()
    scrollTarget: Element | Window = this;

    @property()
    keyFunction: (item:any) => any;

    // @property()
    // private _layout: Layout | Type<Layout> | LayoutConfig

    // private _scrollToIndex: {index: number, position: string};

    constructor() {
        super();
        this._scroller = new VirtualScroller();
        this.addEventListener('rangeChanged', (e: RangeChangeEvent) => {
            this._first = e.first;
            this._last = e.last;
        })
    }
  
    connectedCallback() {
        super.connectedCallback();
        this._scroller.container = this;
        this._scroller.scrollTarget = this.scrollTarget;
    }
  
    disconnectedCallback() {
        super.disconnectedCallback();
        this._scroller.container = null;
    }
  
    createRenderRoot() {
        return this;
    }

    get items() {
        return this._items;
    }

    set items(items) {
        this._items = items;
        this._scroller.totalItems = items.length;
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

    set layout(layout: Layout | Type<Layout> | LayoutConfig) {
        // TODO (graynorton): Shouldn't have to set this here
        this._scroller.container = this;
        this._scroller.scrollTarget = this.scrollTarget;
        this._scroller.layout = layout;
    }

    get layout() {
        return this._scroller.layout;
    }
    
    
    /**
     * Scroll to the specified index, placing that item at the given position
     * in the scroll view.
     */
    async scrollToIndex(index: number, position: string = 'start') {
        this._scroller.scrollToIndex = {index, position}
        // this._scrollToIndex = {index, position};
        // this.requestUpdate();
        // await this.updateComplete;
        // this._scrollToIndex = null;
    }

    render(): TemplateResult {
        let { items, _first, _last, renderItem, keyFunction } = this;
        if (!keyFunction) {
            keyFunction = item => item;
        }
        const itemsToRender = [];
        for (let i = _first; i < _last + 1; i++) {
            itemsToRender.push(items[i]);
        }
        return html`
            ${repeat(itemsToRender, keyFunction, renderItem)}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'lit-virtualizer': LitVirtualizer<unknown, HTMLElement>;
    }
}