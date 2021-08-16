/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { TemplateResult, noChange, ChildPart, html, render } from 'lit';
import { directive, PartInfo, PartType } from 'lit/directive.js';
import { AsyncDirective } from 'lit/async-directive.js';
import { repeat } from 'lit/directives/repeat.js';
import { Layout, LayoutConstructor, LayoutSpecifier } from './layouts/Layout.js';
import { VirtualScroller, ScrollToIndexValue, RangeChangedEvent } from './VirtualScroller.js';

/**
 * Configuration options for the scroll directive.
 */
interface ScrollConfig {
    /**
     * A function that returns a lit-html TemplateResult. It will be used
     * to generate the DOM for each item in the virtual list.
     */
    renderItem?: (item: any, index: number) => TemplateResult;

    keyFunction?: (item: any) => unknown;

    // TODO (graynorton): Document...
    layout?: Layout | LayoutConstructor | LayoutSpecifier;

    /**
     * The list of items to display via the renderItem function.
     */
    items?: Array<unknown>;

    /**
     * Index and position of the item to scroll to.
     */
    scrollToIndex?: ScrollToIndexValue;
  }

/*export */const defaultKeyFunction = (item: any) => item;
/*export */const defaultRenderItem = (item: any) => html`${JSON.stringify(item, null, 2)}`;

class ScrollDirective extends AsyncDirective {
    scroller: VirtualScroller | null = null
    first = 0
    last = -1
    cachedConfig?: ScrollConfig
    renderItem: (item: any, index: number) => TemplateResult = defaultRenderItem;
    keyFunction: (item: any) => unknown = defaultKeyFunction;
    items: Array<unknown> = []

    constructor(part: PartInfo) {
        super(part);
        if (part.type !== PartType.CHILD) {
            throw new Error('The scroll directive can only be used in child expressions');
        }
    }

    render(config?: ScrollConfig) {
        if (config) {
            this._setFunctions(config);
        }
        const itemsToRender = [];
        if (this.first >= 0 && this.last >= this.first) {
            for (let i = this.first; i < this.last + 1; i++) {
                itemsToRender.push(this.items[i]);
            }
        }
        return repeat(itemsToRender, this.keyFunction || defaultKeyFunction, this.renderItem);
    }

    update(part: ChildPart, [config]: [ScrollConfig]) {
        this._setFunctions(config);
        this.items = config.items || [];
        if (this.scroller) {
            this._updateScrollerConfig(config);
        }
        else {
            if (!this.cachedConfig) {
                setTimeout(() => this._initialize(part));
            }
            this.cachedConfig = config;
        }
        return noChange;
    }

    _updateScrollerConfig(config: ScrollConfig) {
        const { scroller } = this;
        scroller!.items = this.items;
        if (config.layout) {
            scroller!.layout = config.layout;
        }
        if (config.scrollToIndex) {
            scroller!.scrollToIndex = config.scrollToIndex;
        }
        // this._setFunctions(config);
    }

    private _setFunctions(config: ScrollConfig) {
        const { renderItem, keyFunction } = config;
        if (renderItem) {
            this.renderItem = (item, idx) => renderItem(item, idx + this.first);
        }
        if (keyFunction) {
            this.keyFunction = keyFunction;
        };
    }

    private _initialize(part: ChildPart) {
        const config = this.cachedConfig!;
        const hostElement = part.parentNode as HTMLElement;
        if (hostElement && hostElement.nodeType === 1) {
            // let containerElement, mutationObserverTarget;
            // if (hostElement.shadowRoot) {
            //     containerElement = hostElement.shadowRoot.querySelector('[lit-virtualizer-container]') as HTMLElement || undefined;
            //     if (containerElement) {
            //         mutationObserverTarget = '__shady' in hostElement.shadowRoot ? containerElement : hostElement;
            //     }
            // }
            const layout = config.layout;
            this.scroller = new VirtualScroller({ hostElement, /*containerElement, mutationObserverTarget,*/ layout });
            // setTimeout(() => this.scroller!.connected());
            this.scroller!.connected();
            hostElement.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
                e.stopPropagation();
                this.first = e.first;
                this.last = e.last;
                render(this.render(), hostElement);
            });
            this.update(part, [config]);
        }
        else {
            console.log('uh-oh!');
        }
    }

    disconnected() {
        this.scroller?.disconnected();
    }

    reconnected() {
        this.scroller?.connected();
    }
}

export const scroll = directive(ScrollDirective);
