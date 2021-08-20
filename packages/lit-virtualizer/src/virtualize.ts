/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { TemplateResult, /*noChange, */ChildPart, html, noChange } from 'lit';
import { directive, PartInfo, PartType } from 'lit/directive.js';
import { AsyncDirective } from 'lit/async-directive.js';
import { repeat } from 'lit/directives/repeat.js';
import { Layout, LayoutConstructor, LayoutSpecifier } from './layouts/Layout.js';
import { Virtualizer, ScrollToIndexValue, RangeChangedEvent } from './Virtualizer.js';

/**
 * Configuration options for the virtualize directive.
 */
interface VirtualizeConfig {
    /**
     * A function that returns a lit-html TemplateResult. It will be used
     * to generate the DOM for each item in the virtual list.
     */
    renderItem?: (item: any, index: number) => TemplateResult;

    keyFunction?: (item: any) => unknown;

    scroll?: boolean;

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

class VirtualizeDirective extends AsyncDirective {
    virtualizer: Virtualizer | null = null
    first = 0
    last = -1
    cachedConfig?: VirtualizeConfig
    renderItem: (item: any, index: number) => TemplateResult = defaultRenderItem;
    keyFunction: (item: any) => unknown = defaultKeyFunction;
    items: Array<unknown> = []

    constructor(part: PartInfo) {
        super(part);
        if (part.type !== PartType.CHILD) {
            throw new Error('The virtualize directive can only be used in child expressions');
        }
    }

    render(config?: VirtualizeConfig) {
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

    update(part: ChildPart, [config]: [VirtualizeConfig]) {
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

    _updateVirtualizerConfig(config: VirtualizeConfig) {
        const { virtualizer } = this;
        virtualizer!.items = this.items;
        if (config.layout) {
            virtualizer!.layout = config.layout;
        }
        if (config.scrollToIndex) {
            virtualizer!.scrollToIndex = config.scrollToIndex;
        }
    }

    private _setFunctions(config: VirtualizeConfig) {
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
            const { layout, scroll } = config;
            this.virtualizer = new Virtualizer({ hostElement, layout, scroll });
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

export const virtualize = directive(VirtualizeDirective);