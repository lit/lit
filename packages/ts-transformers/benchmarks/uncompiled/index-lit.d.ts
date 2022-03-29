import { LitElement } from 'lit';
import type { SimpleItem } from './simple-item.js';
export declare class XThing extends LitElement {
    static styles: import("lit").CSSResult;
    from: string;
    time: string;
    subject: string;
    protected render(): import("lit").TemplateResult<1>;
}
export declare class XItem extends LitElement {
    static styles: import("lit").CSSResult;
    item: SimpleItem;
    protected render(): import("lit").TemplateResult<1>;
    onClick(): void;
}
export declare class XApp extends LitElement {
    items: SimpleItem[];
    protected render(): import("lit").TemplateResult<1>;
}
