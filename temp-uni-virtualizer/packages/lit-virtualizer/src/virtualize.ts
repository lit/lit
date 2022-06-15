/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { TemplateResult, ChildPart, html, noChange } from 'lit';
import { directive, DirectiveResult, PartInfo, PartType } from 'lit/directive.js';
import { AsyncDirective } from 'lit/async-directive.js';
import { repeat } from 'lit/directives/repeat.js';
import { Layout, LayoutConstructor, LayoutSpecifier } from './layouts/shared/Layout.js';
import { Virtualizer, ScrollToIndexValue, RangeChangedEvent } from './Virtualizer.js';

/**
 * Configuration options for the virtualize directive.
 */
export interface VirtualizeDirectiveConfig<T> {
    /**
     * A function that returns a lit-html TemplateResult. It will be used
     * to generate the DOM for each item in the virtual list.
     */
    renderItem?: (item: T, index: number) => TemplateResult;

    keyFunction?: (item: T) => unknown;

    scroller?: boolean;

    // TODO (graynorton): Document...
    layout?: Layout | LayoutConstructor | LayoutSpecifier;

    /**
     * The list of items to display via the renderItem function.
     */
    items?: Array<T>;

    /**
     * Index and position of the item to scroll to.
     */
    scrollToIndex?: ScrollToIndexValue;
  }

/*export */const defaultKeyFunction = <T>(item: T) => item;
/*export */const defaultRenderItem = <T>(item: T) => html`${JSON.stringify(item, null, 2)}`;

class VirtualizeDirective<T> extends AsyncDirective {
    virtualizer: Virtualizer | null = null;
    first = 0;
    last = -1;
    cachedConfig?: VirtualizeDirectiveConfig<T>;
    renderItem: (item: T, index: number) => TemplateResult = defaultRenderItem;
    keyFunction: (item: T) => unknown = defaultKeyFunction;
    items: Array<T> = [];

    constructor(part: PartInfo) {
        super(part);
        if (part.type !== PartType.CHILD) {
            throw new Error('The virtualize directive can only be used in child expressions');
        }
    }

    render(config?: VirtualizeDirectiveConfig<T>) {
        if (config) {
            this._setFunctions(config);
        }
        const itemsToRender: Array<T> = [];
        // TODO (graynorton): Is this the best / only place to ensure
        // that _last isn't outside the current bounds of the items array?
        // Not sure we should ever arrive here with it out of bounds.
        // Repro case for original issue: https://tinyurl.com/yes8b2e6
        const lastItem = Math.min(this.items.length, this.last + 1);

        if (this.first >= 0 && this.last >= this.first) {
            for (let i = this.first; i < lastItem; i++) {
                itemsToRender.push(this.items[i]);
            }
        }
        return repeat(itemsToRender, this.keyFunction || defaultKeyFunction, this.renderItem);
    }

    update(part: ChildPart, [config]: [VirtualizeDirectiveConfig<T>]) {
        this._setFunctions(config);
        this.items = config.items || [];
        if (this.virtualizer) {
            this._updateVirtualizerConfig(config);
        }
        else {
            if (!this.cachedConfig) {
                setTimeout(() => this._initialize(part));
            }
            this.cachedConfig = config;
        }
        return noChange;
        // super.update(part, [config]);
    }

    _updateVirtualizerConfig(config: VirtualizeDirectiveConfig<T>) {
        const { virtualizer } = this;
        virtualizer!.items = this.items;
        if (config.layout) {
            virtualizer!.layout = config.layout;
        }
        if (config.scrollToIndex) {
            virtualizer!.scrollToIndex = config.scrollToIndex;
        }
    }

    private _setFunctions(config: VirtualizeDirectiveConfig<T>) {
        const { renderItem, keyFunction } = config;
        if (renderItem) {
            this.renderItem = (item, idx) => renderItem(item, idx + this.first);
        }
        if (keyFunction) {
            this.keyFunction = keyFunction;
        }
    }

    private _initialize(part: ChildPart) {
        const config = this.cachedConfig!;
        const hostElement = part.parentNode as HTMLElement;
        if (hostElement && hostElement.nodeType === 1) {
            const { layout, scroller } = config;
            this.virtualizer = new Virtualizer({ hostElement, layout, scroller });
            this.virtualizer!.connected();
            hostElement.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
                e.stopPropagation();
                this.first = e.first;
                this.last = e.last;
                this.setValue(this.render());
            });
            this.update(part, [config]);
        }
        else {
            console.log('uh-oh!');
        }
    }

    disconnected() {
        this.virtualizer?.disconnected();
    }

    reconnected() {
        this.virtualizer?.connected();
    }
}

export const virtualize = directive(VirtualizeDirective) as <T>(config?: VirtualizeDirectiveConfig<T>) => DirectiveResult<typeof VirtualizeDirective>;
