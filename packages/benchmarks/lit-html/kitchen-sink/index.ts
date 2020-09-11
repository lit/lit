/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * Kitchen-sink benchmark for lit-html
 * 
 * Features exercised:
 * - NodePart
 *   - value: string
 *   - value: Node
 *   - value: Array<TemplateResult>
 *   - value: directive: repeat
 *   - value: nothing
 * - AttributePart
 *   - value: string (single)
 *   - value: string (multiple)
 *   - value: directive: classMap
 *   - value: directive: styleMap
 * - PropertyPart
 *   - value: object
 * - EventPart
 *   - value: function
 * 
 * Available query params:
 * - width: number of items in each map/repeat per item
 * - depth: number of levels of item recursion
 * - updateCount: number of times to update after initial render
 * - updateData: boolean, false to reuse same data each update, true to regenerate
*/

import { html, render, nothing} from "lit-html";

// TODO(kschaaf) use real repeat once landed
// import { repeat } from "lit-html/lib/directives/repeat.js";
const repeat = (items: any[], _kfn: (i: any) => any, tfn: (i: any) => any) => items.map(i => tfn(i));

// TODO(kschaaf) use real classMap once landed
// import { classMap } from "lit-html/lib/directives/class-map.js";
const classMap = (classes: {[key:string]: boolean}) => Object.keys(classes).filter(k => classes[k]).join(' ');

// TODO(kschaaf) use real styleMap once landed
// import { styleMap } from "lit-html/lib/directives/style-map.js";
const styleMap = (style: {[key:string]: boolean}) => Object.entries(style).map(([k, v]) => `${k}: ${v}`).join('; ');

// IE doesn't support URLSearchParams
const params = document.location.search
  .slice(1)
  .split('&')
  .map(p => p.split('='))
  .reduce((p: {[key:string]: any}, [k,v]) => (p[k]=JSON.parse(v || 'true'),p), {}) 

const REPEAT_WIDTH = params.width || 10;
const REPEAT_DEPTH = params.depth || 4;
const UPDATE_COUNT = params.updateCount || 0;
const UPDATE_DATA = params.updateData

interface Data {
  key: number,
  text: string,
  property: {},
  classes: {},
  style: {},
  node: Node,
  handler: () => void,
  childData?: Data[],
  useRepeat?: boolean
};

const generateData = (
  updateId = 0,
  id = 0,
  parent: string | undefined = undefined,
  currentDepth = 0, 
  maxDepth = REPEAT_DEPTH): Data => {
    const moniker = `${parent ? `${parent}-` : ''}${id}`;
    return {
      key: id,
      text: `Item ${moniker}${updateId ? `#${updateId}`: ''}`,
      property: {},
      node: document.createElement('span'),
      classes: {
        foo: !!(updateId % 2),
        bar: !(updateId % 2),
        ziz: true,
        zaz: false
      },
      style: {
        'border-top-width': `${updateId % 2}px`,
        'border-bottom-width': `${(updateId + 1) % 2}px`,
        'border-left-width': '0px',
        'border-right-width': '0px'
      },
      handler: () => {},
      ...((currentDepth < maxDepth) && {
        childData: new Array(REPEAT_WIDTH).fill(0).map((_, i) => generateData(updateId, i, moniker, currentDepth + 1, maxDepth)),
        useRepeat: !(id % 2)
      })
  };
};

const renderItem: any = (data: Data) => html`
  <div class="${classMap(data.classes)} static" style=${styleMap(data.style)}>
    ${data.text}
    <!-- Comment binding ${data.text} -->
    <div .property=${data.property} attr=${data.text} multi="~${data.text}~${data.text}~${data.text}~"></div>
    <div @click=${data.handler}></div>
    ${data.node}
    <!-- Make sure to have a decent ratio of static:dynamic nodes  -->
    <div class="foo bar baz">
      <div class="foo bar baz"></div>
      <div><span></span></div>
      <div class="foo bar baz"></div>
      <div><span></span></div>
      <div class="foo bar baz"></div>
    </div>
    <div class="foo bar baz"></div>
    ${data.childData ?
      html`<div mode="${data.useRepeat ? 'repeat' : 'map'}">
        ${data.useRepeat ? 
          repeat(data.childData, (item) => item.key, (item) => renderItem(item)) :
          data.childData.map((item => renderItem(item)))
        }
      </div>` 
      : nothing
    }
    </div>
  </div>
  `;

let data = generateData(0);

// Initial render
performance.mark("render-start");
render(renderItem(data), document.body);
performance.measure("render", "render-start");

// Update
performance.mark("update-start");
for (let i=0; i<UPDATE_COUNT; i++) {
  if (UPDATE_DATA) {
    data = generateData(i+1);
  }
  render(renderItem(data), document.body);
}
performance.measure("update", "update-start");

// Log
console.log(`render: ${performance.getEntriesByName('render')[0].duration.toFixed(3)}ms`);
console.log(`update: ${performance.getEntriesByName('update')[0].duration.toFixed(3)}ms`);
