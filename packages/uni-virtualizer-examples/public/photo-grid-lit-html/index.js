import {html, render} from 'lit';
import {scroll, scrollerRef} from 'lit-virtualizer';
import {Layout1dSquareGrid} from 'lit-virtualizer/lib/uni-virtualizer/lib/layouts/Layout1dSquareGrid.js';
import {Layout1dFlex} from 'lit-virtualizer/lib/uni-virtualizer/lib/layouts/Layout1dFlex.js';
import {getDims, getUrl, searchFlickr} from './flickr.js';

import {VirtualArray} from './VirtualArray.js';

import '@material/mwc-drawer';
import '@material/mwc-top-app-bar';
import '@material/mwc-slider';
import '@material/mwc-textfield';
import '@material/mwc-formfield';
import '@material/mwc-radio';

///

const renderPhoto = photo => {
    if (photo) {
        // const {width, height} = getDims(photo);
        // return html`<div style="--ratio: ${width / height}"><img src=${getUrl(photo)} /></div>`;
        // return html`<img src=${getUrl(photo)} />`;
        const url = photo.id === 'TEMP' ? '' : getUrl(photo);
        // if (photo.id === 'TEMP') {
        //     return html`<div class="box"></div>`;
        // }
        return html`<img src=${url} style="width: 200px; height: 200px;" />`;
    }
}

async function getPhotos(query, mock=false) {
    return new VirtualArray({
        pageSize: 5,
        fetchPage: async (pageSize, pageNum) => {
            const resp = await searchFlickr(query, pageSize, pageNum, mock);
            return {
                // items: resp.photo.map(p => Object.assign({}, {width_o: 1920, height_o: 1080}, p)),
                items: resp.photo,
                totalItems: resp.total
            };
            // return resp.photo.filter(p => p.width_o);
        },
        placeholder: () => {
            // return {"id":"TEMP","height_o":769,"width_o":1024};
            return {id: "TEMP"};
        },
        callback: items => {
            setState({ items });
        }
    });
    // const resp = await searchFlickr(query, 500, 1, mock);
    // return resp.photo.filter(p => p.width_o);
}

///

const renderBox = (item, idx) => {
    return html`<div class="box">${idx}</div>`;
}

///

const state = {
    open: false,
    showRange: false,
    items: [],
    direction: 'vertical',
    idealSize: 300,
    spacing: 8,
    query: 'sunset',
    Layout: Layout1dFlex,
    layout: null,
    first: 0,
    last: 0,
    firstVisible: 0,
    lastVisible: 0
}

function setState(changes) {
    let changed;
    for (let prop in changes) {
        if (changes[prop] !== state[prop]) {
            changed = true;
            break;
        }
    }
    if (changed) {
        Object.assign(state, changes);
        render(renderExample(), document.body);    
    }
    // especially hacky
    if (changes.Layout) {
        updateItemSizes(state.items);
    }
    
}

function renderExample() {
    let {open, showRange, items, direction, idealSize, spacing, query, Layout, layout, first, last, firstVisible, lastVisible} = state;
    // if (!(layout instanceof Layout)) {
    //     layout = (state.layout = new Layout({idealSize, spacing, direction}));
    //     updateItemSizes(items);
    // }
    // else {
    //     Object.assign(layout, {idealSize, spacing, direction, totalItems: items.length});
    // }
    return html`
<style>
    body {margin: 0; height: 100vh;}
    .appLayout {height: 100%; display: flex; flex-direction: column;}
    .appBody {flex: 1; display: flex;}
    .sheet {width: 0; border-right: 1px solid #DDD; transition: width 0.25s ease-out;}
    .controls {display: flex; flex-direction: column; width: 256px; transform: translateX(-256px); transition: transform 0.25s ease-out;}
    .controls > * {display: block; margin: 8px;}
    .scroller {height: unset; flex: 1;}
    .open .controls {transform: translateX(0);}
    .open .sheet {width: 256px;}
    .scroller > * {transition: all 0.25s;}
    .box {background: #DDD;}
    .sheet {font-family: Roboto, sans-serif; font-size: 0.75rem; font-weight: 400; color: rgba(0, 0, 0, 0.6);}
    mwc-formfield {display: block;}
</style>
<div class="appLayout${open ? ' open' : ''}">
    <mwc-top-app-bar>
        <mwc-icon-button slot="navigationIcon" @click=${() => setState({open: !open})}>
            <svg slot="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><use xlink:href="#settings"></use></svg>
        </mwc-icon-button>
        <div slot="title">lit-virtualizer grid layouts</div>
    </mwc-top-app-bar>
    <div class="appBody">
        <div class="sheet">
            <div class="controls">
                <mwc-textfield label="Ideal Size" type="number" min="50" max="500" step="5" .value=${idealSize} @input=${(e) => setState({idealSize: e.target.value})}></mwc-textfield>
                <mwc-textfield label="Gap" type="number" min="0" max="100" step="1" .value=${spacing} @input=${(e) => setState({spacing: e.target.value})}></mwc-textfield>
                <mwc-textfield label="Search Query" .value=${query} @change=${(e) => search(e.target.value)}></mwc-textfield>
                <fieldset @change=${e => setState({direction: e.target.value})}>
                    <legend>Direction</legend>
                    <mwc-formfield label="vertical">
                        <mwc-radio name="direction" value="vertical" ?checked=${direction === 'vertical'}></mwc-radio>
                    </mwc-formfield>
                    <mwc-formfield label="horizontal">
                        <mwc-radio name="direction" value="horizontal" ?checked=${direction === 'horizontal'}></mwc-radio>
                    </mwc-formfield>
                </fieldset>
                <fieldset @change=${e => setState({Layout: e.target.value})}>
                    <legend>Layout</legend>
                    <mwc-formfield label="Square grid">
                        <mwc-radio name="layout" .value=${Layout1dSquareGrid} ?checked=${Layout === Layout1dSquareGrid}></mwc-radio>
                    </mwc-formfield>
                    <mwc-formfield label="Flex wrap">
                        <mwc-radio name="layout" .value=${Layout1dFlex} ?checked=${Layout === Layout1dFlex}></mwc-radio>
                    </mwc-formfield>
                </fieldset>
                <details ?open=${showRange} @toggle=${e => setState({showRange: e.target.open})}>
                    <summary>Range</summary>
                    ${showRange ? html`
                        <p>Physical: ${first} to ${last}</p>
                        <p>Visible: ${firstVisible} to ${lastVisible}</p>` : ''
                    }
                </details>
            </div>
        </div>
        <div class="scroller" @rangechange=${(e) => {
            if (showRange) {
                const {first, last, firstVisible, lastVisible} = e;
                setState({first, last, firstVisible, lastVisible});
            }
        }}>
            ${scroll({items, renderItem, layout: {
                type: Layout,
                idealSize,
                spacing,
                direction
            }})}
        </div>
    </div>
</div>


<svg width="0" height="0" class="screen-reader">
    <defs>
        <path id="settings" d="M19.14 12.936c.036-.3.06-.612.06-.936s-.024-.636-.072-.936l2.028-1.584a.496.496 0 0 0 .12-.612l-1.92-3.324c-.12-.216-.372-.288-.588-.216l-2.388.96a7.03 7.03 0 0 0-1.62-.936l-.36-2.544a.48.48 0 0 0-.48-.408h-3.84a.467.467 0 0 0-.468.408l-.36 2.544a7.219 7.219 0 0 0-1.62.936l-2.388-.96a.475.475 0 0 0-.588.216l-1.92 3.324a.465.465 0 0 0 .12.612l2.028 1.584c-.048.3-.084.624-.084.936s.024.636.072.936L2.844 14.52a.496.496 0 0 0-.12.612l1.92 3.324c.12.216.372.288.588.216l2.388-.96a7.03 7.03 0 0 0 1.62.936l.36 2.544c.048.24.24.408.48.408h3.84c.24 0 .444-.168.468-.408l.36-2.544a7.219 7.219 0 0 0 1.62-.936l2.388.96c.216.084.468 0 .588-.216l1.92-3.324a.465.465 0 0 0-.12-.612l-2.004-1.584zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6s-1.62 3.6-3.6 3.6z"/>
    </defs>
</svg>

`};


///

const offline = false;
const mock = offline;
const renderItem = offline ? renderBox : renderPhoto;

function itemSizes(items) {
    return items.reduce((obj, item, idx) => { obj[idx] = { width: item.width_o, height: item.height_o }; return obj; }, {});
}

function updateItemSizes(items) {
    const layout = document.querySelector('.scroller')[scrollerRef].layout;
    if (layout && typeof layout.updateItemSizes === 'function') {
       layout.updateItemSizes(itemSizes(items));
    }
}

async function search(query) {
    const items = await getPhotos(query, mock);
    // for (let i = 0; i < items.length; i++) {
    //     console.log(items[i]);
    // }
    setState({items});
    // updateItemSizes(items);
}

render(renderExample(), document.body);
search(state.query);

// <!-- ${renderPhotos(items)} -->
// <!-- ${renderBoxes(items)} -->
// <!-- ${renderGridStyles()} -->
// <!-- ${renderFlexWrapStyles()} -->