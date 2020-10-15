import { directive, NodePart, TemplateResult, Directive, PartInfo, html, NODE_PART, nothing } from 'lit-html';
import { setPartValue } from 'lit-html/parts.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { Type, Layout, LayoutConfig } from './uni-virtualizer/lib/layouts/Layout.js';
import { VirtualScroller, RangeChangeEvent } from './uni-virtualizer/lib/VirtualScroller.js';

/**
 * Configuration options for the scroll directive.
 */
interface ScrollConfig<Item> {
    /**
     * A function that returns a lit-html TemplateResult. It will be used
     * to generate the DOM for each item in the virtual list.
     */
    renderItem?: (item: Item, index?: number) => TemplateResult;

    keyFunction?: (item:any) => any;
  
    // TODO (graynorton): Document...
    layout?: Layout | Type<Layout> | LayoutConfig;
  
    /**
     * An element that receives scroll events for the virtual scroller.
     */
    scrollTarget?: Element | Window;
  
    /**
     * The list of items to display via the renderItem function.
     */
    items?: Array<Item>;
  
    /**
     * Limit for the number of items to display. Defaults to the length of the
     * items array.
     */
    totalItems?: number;
  
    /**
     * Index and position of the item to scroll to.
     */
    scrollToIndex?: {index: number, position?: string};
  }
  
const defaultKeyFunction = item => item;

class ScrollDirective extends Directive {
    container: HTMLElement
    scroller: VirtualScroller<unknown, HTMLElement>
    first: number = 0
    last: number = -1
    renderItem: (item: any, index?: number) => TemplateResult
    keyFunction: (item: any) => any
    items: Array<any>

    constructor(part: PartInfo) {
        super();
        if (part.type !== NODE_PART) {
            throw new Error('The scroll directive can only be used in text bindings');
        }
    }
    
    render<T>(config?: ScrollConfig<T>) {
        if (config) {
            this.renderItem = config.renderItem;
            this.keyFunction = config.keyFunction;
        }
        const itemsToRender = [];
        if (this.first >= 0 && this.last >= this.first) {
            for (let i = this.first; i < this.last + 1; i++) {
                itemsToRender.push(this.items[i]);
            }    
        }
        return html`${repeat(itemsToRender, this.keyFunction || defaultKeyFunction, this.renderItem)}`;
    }

    update<T>(part: NodePart, [config]: [ScrollConfig<T>]) {
        if (this.scroller || this._initialize(part, config)) {
            const { scroller } = this;
            this.items = scroller.items = config.items;
            scroller.totalItems = config.totalItems || config.items?.length || 0;
            scroller.layout = config.layout;
            scroller.scrollTarget = config.scrollTarget || this.container;
            if (config.scrollToIndex) {
                scroller.scrollToIndex = config.scrollToIndex;
            }
            return this.render(config);    
        }
        return nothing;
    }

    private _initialize<T>(part: NodePart, config: ScrollConfig<T>) {
        // TODO (GN): Replace reference to part._startNode when a public alternative
        // is available (https://github.com/Polymer/lit-html/issues/1346)
        const container = this.container = part._startNode.parentElement;
        if (container) {
            this.scroller = new VirtualScroller({ container });
            container.addEventListener('rangeChanged', (e: CustomEvent<RangeChangeEvent>) => {
                this.first = e.detail.first;
                this.last = e.detail.last;
                setPartValue(part, this.render());
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