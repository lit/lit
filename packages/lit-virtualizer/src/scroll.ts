import { TemplateResult, noChange, ChildPart, html } from 'lit';
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
    renderItem?: (item: any, index?: number) => TemplateResult;

    keyFunction?: (item: any) => unknown;
  
    // TODO (graynorton): Document...
    layout?: Layout | LayoutConstructor | LayoutSpecifier;
  
    /**
     * An element that receives scroll events for the virtual scroller.
     */
    scrollTarget?: Element | Window;
  
    /**
     * The list of items to display via the renderItem function.
     */
    items?: Array<any>;
  
    /**
     * Index and position of the item to scroll to.
     */
    scrollToIndex?: ScrollToIndexValue;
  }
  
/*export */const defaultKeyFunction = (item: any) => item;
/*export */const defaultRenderItem = (item: any) => html`${JSON.stringify(item, null, 2)}`;

class ScrollDirective extends AsyncDirective {
    container: HTMLElement | null = null
    scroller: VirtualScroller | null = null
    first = 0
    last = -1
    renderItem: (item: any, index?: number) => TemplateResult = defaultRenderItem;
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
        if (this.scroller || this._initialize(part, config)) {
            const { scroller } = this;
            this.items = scroller!.items = config.items || [];
            if (config.layout) {
                scroller!.layout = config.layout;
            }
            if (config.scrollToIndex) {
                scroller!.scrollToIndex = config.scrollToIndex;
            }
            this._setFunctions(config);
        }
        return noChange;
    }

    private _setFunctions(config: ScrollConfig) {
        this.renderItem = config.renderItem || this.renderItem;
        this.keyFunction = config.keyFunction || this.keyFunction;
    }

    private _initialize(part: ChildPart, config: ScrollConfig) {
        const container = this.container = part.parentNode as HTMLElement;
        const scrollTarget = config.scrollTarget || container;
        const layout = config.layout;
        if (container && container.nodeType === 1) {
            this.scroller = new VirtualScroller({ container, scrollTarget, layout });
            container.addEventListener('rangeChanged', (e: RangeChangedEvent) => {
                this.first = e.first;
                this.last = e.last;
                this.setValue(this.render());
            });
            return true;
        }
        // TODO (GN): This seems to be needed in the case where the `scroll`
        // directive is used within the `LitVirtualizer` element. Figure out why
        // and see if there's a cleaner solution.
        Promise.resolve().then(() => this.update(part, [config]));
        return false;
    }
}

export const scroll = directive(ScrollDirective);