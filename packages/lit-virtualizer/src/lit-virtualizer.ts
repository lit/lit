/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { html, LitElement, TemplateResult, render } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { repeat } from 'lit/directives/repeat.js';
import { scrollerRef, VirtualizerHostElement, VirtualScroller, RangeChangedEvent } from './VirtualScroller.js';
import { LayoutSpecifier, Layout, LayoutConstructor } from './layouts/Layout.js';


type RenderItemFunction = ((item: any, index: number) => TemplateResult)
const defaultKeyFunction = (item: any) => item;
const defaultRenderItem: RenderItemFunction = (item: any, idx: number) => html`${idx}: ${JSON.stringify(item, null, 2)}`;

/**
 * A LitElement wrapper of the scroll directive.
 *
 * Import this module to declare the lit-virtualizer custom element.
 * Pass an items array, renderItem method, and scroll target as properties
 * to the <lit-virtualizer> element.
 */
@customElement('lit-virtualizer')
export class LitVirtualizer extends LitElement {
    private _renderItem: RenderItemFunction = (item, idx) => defaultRenderItem(item, idx + this._first);

    set renderItem(fn: RenderItemFunction) {
        this._renderItem = (item, idx) => fn(item, idx + this._first);
    }

    @property()
    get renderItem() {
        return this._renderItem;
    }

    @property({attribute: false})
    items: Array<unknown> = [];

    @property({reflect: true, type: Boolean})
    scroller = false;

    @property()
    keyFunction: ((item:unknown) => unknown) | undefined = defaultKeyFunction;

    @state()
    private _first = 0;

    @state()
    private _last = -1;

    private _layout?: Layout | LayoutConstructor | LayoutSpecifier | null;

    private _virtualizer?: VirtualScroller;
  
    @property({attribute:false})
    set layout(layout: Layout | LayoutConstructor | LayoutSpecifier | null) {
        this._layout = layout;
        if (layout && this._virtualizer) {
            this._virtualizer.layout = layout;
        }
    }

    get layout(): Layout | LayoutConstructor | LayoutSpecifier | null {
        return (this as VirtualizerHostElement)[scrollerRef]!.layout;
    }

    /**
     * Scroll to the specified index, placing that item at the given position
     * in the scroll view.
     */
    scrollToIndex(index: number, position: string = 'start') {
        this._virtualizer!.scrollToIndex = { index, position };
    }

    // // firstUpdated() {
    // constructor() {
    //     super();
    //     const hostElement = this;
    //     const layout = this._layout;
    //     this._virtualizer = new VirtualScroller({ hostElement, layout });
    //     hostElement.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
    //         e.stopPropagation();
    //         this._first = e.first;
    //         this._last = e.last;
    //         render(this.render(), this);
    //     });
    // }

    updated() {
        if (this._virtualizer) {
            if (this._layout !== undefined) {
                this._virtualizer!.layout = this._layout;
            }
            this._virtualizer!.items = this.items;
        }
    }

    firstUpdated() {
        // if (!this._virtualizer) {
            const hostElement = this;
            const layout = this._layout;
            this._virtualizer = new VirtualScroller({ hostElement, layout, scroll: this.scroller });
            hostElement.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
                e.stopPropagation();
                this._first = e.first;
                this._last = e.last;
                render(this.render(), this);
            });    
        // }
        this._virtualizer!.connected();
    }

    connectedCallback() {
        super.connectedCallback();
        if (this._virtualizer) {
            this._virtualizer.connected();
        }
    }

    createRenderRoot() {
        return this;
    }

    render(): TemplateResult {
        const { items, renderItem, keyFunction } = this;
        const itemsToRender = [];
        if (this._first >= 0 && this._last >= this._first) {
            for (let i = this._first; i < this._last + 1; i++) {
                itemsToRender.push(items[i]);
            }    
        }
        return repeat(itemsToRender, keyFunction || defaultKeyFunction, renderItem) as TemplateResult;
        // const children = repeat(itemsToRender, keyFunction || defaultKeyFunction, renderItem) as TemplateResult;
        // return this.scroller ? html`${children}<div virtualizer-sizer></div>` : children;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'lit-virtualizer': LitVirtualizer;
    }
}
