/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { repeat } from 'lit/directives/repeat.js';
import { Virtualizer, VirtualizerHostElement, virtualizerRef, RangeChangedEvent } from './Virtualizer.js';
import { LayoutSpecifier, Layout, LayoutConstructor } from './layouts/shared/Layout.js';


type RenderItemFunction = ((item: any, index: number) => TemplateResult)
const defaultKeyFunction = (item: any) => item;
const defaultRenderItem: RenderItemFunction = (item: any, idx: number) => html`${idx}: ${JSON.stringify(item, null, 2)}`;


export class LitVirtualizer extends LitElement {
    private _renderItem: RenderItemFunction = (item, idx) => defaultRenderItem(item, idx + this._first);
    private _providedRenderItem: RenderItemFunction = defaultRenderItem;

    set renderItem(fn: RenderItemFunction) {
        this._providedRenderItem = fn;
        this._renderItem = (item, idx) => fn(item, idx + this._first);
        this.requestUpdate();
    }

    @property()
    get renderItem() {
        return this._providedRenderItem;
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

    private _virtualizer?: Virtualizer;

    @property({attribute:false})
    set layout(layout: Layout | LayoutConstructor | LayoutSpecifier | null) {
        this._layout = layout;
        if (layout && this._virtualizer) {
            this._virtualizer.layout = layout;
        }
    }

    get layout(): Layout | LayoutConstructor | LayoutSpecifier | null {
        return (this as VirtualizerHostElement)[virtualizerRef]!.layout;
    }

    /**
     * Scroll to the specified index, placing that item at the given position
     * in the scroll view.
     */
    scrollToIndex(index: number, position: string = 'start') {
        this._virtualizer!.scrollToIndex = { index, position };
    }

    updated() {
        if (this._virtualizer) {
            if (this._layout !== undefined) {
                this._virtualizer!.layout = this._layout;
            }
            this._virtualizer!.items = this.items;
        }
    }

    firstUpdated() {
        const hostElement = this;
        const layout = this._layout;
        this._virtualizer = new Virtualizer({ hostElement, layout, scroller: this.scroller });
        hostElement.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
            e.stopPropagation();
            this._first = e.first;
            this._last = e.last;
        });    
        this._virtualizer!.connected();
    }

    connectedCallback() {
        super.connectedCallback();
        if (this._virtualizer) {
            this._virtualizer.connected();
        }
    }

    disconnectedCallback() {
        if (this._virtualizer) {
            this._virtualizer.disconnected();
        }
        super.disconnectedCallback();
    }

    createRenderRoot() {
        return this;
    }

    render(): TemplateResult {
        const { items, _renderItem, keyFunction } = this;
        const itemsToRender = [];
        // TODO (graynorton): Is this the best / only place to ensure
        // that _last isn't outside the current bounds of the items array?
        // Not sure we should ever arrive here with it out of bounds.
        // Also: would like a solid repro case for the issue this was
        // intended to fix (see https://github.com/PolymerLabs/uni-virtualizer/pull/120)
        const lastItem = Math.min(items.length, this._last + 1);

        if (this._first >= 0 && this._last >= this._first) {
            for (let i = this._first; i < lastItem; i++) {
                itemsToRender.push(items[i]);
            }
        }

        return repeat(itemsToRender, keyFunction || defaultKeyFunction, _renderItem) as TemplateResult;
    }    
}
