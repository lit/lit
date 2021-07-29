import { LitElement, html, css } from "lit";
import { classMap } from 'lit/directives/class-map.js';
import '@lit-labs/virtualizer';
import { flow } from '@lit-labs/virtualizer/layouts/FlowLayout.js';
import { scrollerRef } from '@lit-labs/virtualizer/VirtualScroller.js';
import { getPhotos, getUrl } from "../../lib/flickr";

export class PhotoScroller extends LitElement {
    static get properties() {
        return {
            query: { type: String },
            photos: { state: true },
            direction: { state: true }
        }
    }

    static get styles() {
        return css`
            :host {
                display: flex;
                flex-direction: column;
                /* resize: both; */
                /* min-width: 200px;
                min-height: 400px; */
                overflow: hidden;
                --color: black;
                --text-color: white;
                --border-width: 4px;
            }

            div {
                height: 3em;
                line-height: 3em;
                padding: 0 1em;
                font-family: sans-serif;
                background: var(--color);
                color: var(--text-color);
            }

            lit-virtualizer {
                flex: 1;
                background: var(--color);
                border: var(--border-width) solid var(--color);
            }

            img {
                margin: var(--border-width);
            }

            .horizontal {
                border-top: none;
                border-bottom: none;
            }

            .vertical {
                border-left: none;
                border-right: none;
            }

            .horizontal img {
                height: calc(100% - (2 * var(--border-width)));
            }

            .vertical img {
                width: calc(100% - (2 * var(--border-width)));
            }

            .horizontal img.first {
                margin-left: 0;
            }

            .vertical img.first {
                margin-top: 0;
            }

            .horizontal img.last {
                margin-right: 0;
            }

            .veritcal img.last {
                margin-bottom: 0;
            }
        `;
    }

    constructor() {
        super();
        this.query = 'chocolate';
        this.direction = 'horizontal';
        this.resizeObserver = new ResizeObserver(this.onResized.bind(this));
        this.resizeObserver.observe(this);
    }

    update(changed) {
        if (changed.has('query')) {
            this.search();
            if (changed.size === 1) {
                return;
            }
        }
        super.update(changed);
    }

    get scroller() {
        return this.shadowRoot.querySelector('lit-virtualizer')[scrollerRef];
    }

    render() {
        return html`
            <div>${this.query}</div>
            <lit-virtualizer
                scroller
                class=${this.direction}
                .items=${this.photos}
                .renderItem=${(photo, idx) => photo
                    ? html`
                        <img
                            class=${classMap({
                                first: idx === 0,
                                last: idx === this.photos.length - 1
                            })}
                            src=${getUrl(photo)}
                        />
                    `
                    : null
                }
                .layout=${flow({direction: this.direction})}
            ></lit-virtualizer>
        `;
    }

    search() {
        this.photos = getPhotos(this.query, () => {id: 'TEMP'}, items => this.photos = items)
    }

    onResized(entries) {
        const { width, height } = entries[0].contentRect;
        this.direction = width > height ? 'horizontal' : 'vertical';
    }
}

customElements.define('photo-scroller', PhotoScroller);

// const placeholder = () => {
//     return {id: "TEMP"};
// }

// const callback = items => {
//     setState({ items });
// }

// async function search(query) {
//     const items = await getPhotos(query, placeholder, callback, mock);
//     // for (let i = 0; i < items.length; i++) {
//     //     console.log(items[i]);
//     // }
//     setState({items});
//     // updateItemSizes(items);
// }