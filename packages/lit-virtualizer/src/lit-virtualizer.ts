import { html, css, LitElement, TemplateResult, render } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { query } from 'lit/decorators/query.js';
// import { scroll as scrollDirective } from './scroll.js';
import { repeat } from 'lit/directives/repeat.js';
import { scrollerRef, VirtualizerHostElement, VirtualScroller, RangeChangedEvent } from './VirtualScroller.js';
import { LayoutSpecifier, Layout, LayoutConstructor } from './layouts/Layout.js';

// export { scrollerRef } from './VirtualScroller.js';

/*export */const defaultKeyFunction = (item: any) => item;
/*export */const defaultRenderItem = (item: any) => html`${JSON.stringify(item, null, 2)}`;

/**
 * A LitElement wrapper of the scroll directive.
 *
 * Import this module to declare the lit-virtualizer custom element.
 * Pass an items array, renderItem method, and scroll target as properties
 * to the <lit-virtualizer> element.
 */
@customElement('lit-virtualizer')
export class LitVirtualizer extends LitElement {
    @property()
    renderItem?: ((item: any, index?: number) => TemplateResult) = defaultRenderItem;

    @property({attribute: false})
    items: Array<unknown> = [];

    @property({reflect: true, type: Boolean})
    scroller = false;

    @property()
    keyFunction: ((item:unknown) => unknown) | undefined = defaultKeyFunction;

    @query('div')
    private _container?: HTMLElement;

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
        // TODO: graynorton@: Coercing null to undefined here. Should review
        // use of null for defaults in VirtualScroller and see if we can eliminate.
        return (this as VirtualizerHostElement)[scrollerRef]!.layout;
    }

    static styles = css`
        :host {
            display: block;
            contain: strict;
        }
        :host([scroller]) {
            overflow: auto;
            min-height: 150px;
        }
        :host(not([scroller])),
        div {
            position: relative;
        }
        div > ::slotted(*) {
            position: absolute;
            box-sizing: border-box;
        }
    `;

    /**
     * Scroll to the specified index, placing that item at the given position
     * in the scroll view.
     */
    scrollToIndex(index: number, position: string = 'start') {
        this._virtualizer!.scrollToIndex = { index, position };
    }

    firstUpdated() {
        const hostElement = this;
        const containerElement = this._container || this;
        const mutationObserverTarget = '__shady' in this.shadowRoot! ? containerElement : hostElement;
        const layout = this._layout;
        this._virtualizer = new VirtualScroller({ hostElement, containerElement, mutationObserverTarget, layout });
        hostElement.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
            e.stopPropagation();
            this._first = e.first;
            this._last = e.last;
            this._renderChildren();
        });
    }

    updated() {
        if (this._layout !== undefined) {
            this._virtualizer!.layout = this._layout;
        }
        this._virtualizer!.items = this.items;
        this._renderChildren();
    }

    render(): TemplateResult {
        return this.scroller
            ? html`<div lit-virtualizer-container><slot></slot></div>`
            : html`<slot></slot>`
        ;
    }

    _renderChildren() {
        const { items, renderItem, keyFunction } = this;
        const itemsToRender = [];
        if (this._first >= 0 && this._last >= this._first) {
            for (let i = this._first; i < this._last + 1; i++) {
                itemsToRender.push(items[i]);
            }    
        }
        render(
            repeat(itemsToRender, keyFunction || defaultKeyFunction, renderItem),
            this
        );

    }
}

declare global {
    interface HTMLElementTagNameMap {
        'lit-virtualizer': LitVirtualizer;
    }
}