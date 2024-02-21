/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, render as renderLit} from 'lit-html';
import {
  BoundsRect,
  SelectionMoveEvent,
  ResizeDirection,
  DirectionName,
} from '../lib/ignition-selector.js';

const items = {
  ['item-1' as string]: {
    bounds: {
      top: 100,
      left: 100,
      width: 200,
      height: 200,
    },
    rotation: 0,
    origin: [50, 50],
  },
  ['item-2' as string]: {
    bounds: {
      top: 100,
      left: 400,
      width: 200,
      height: 200,
    },
    rotation: 0,
    origin: [50, 50],
  },
};

const getItemStyle = (id: string) => {
  const item = items[id];
  return `
    top: ${item.bounds.top}px;
    left: ${item.bounds.left}px;
    width: ${item.bounds.width}px;
    height: ${item.bounds.height}px;
    transform: rotate(${item.rotation}deg);
    transform-origin: ${item.origin[0]}% ${item.origin[1]}%;
  `;
};

let selectedItemId: string | undefined = undefined;

const onBoundsChange = (e: SelectionMoveEvent) => {
  if (selectedItemId === undefined) {
    return;
  }
  const newBounds = e.bounds;
  const {bounds} = items[selectedItemId];
  bounds.top = newBounds.top;
  bounds.left = newBounds.left;
  bounds.width = newBounds.width;
  bounds.height = newBounds.height;
  render();
};

const directions = new Set(ResizeDirection.ALL_DIRECTIONS);

const toggleDirection = (name: DirectionName) => {
  const direction = ResizeDirection.getDirection(name);
  if (directions.has(direction)) {
    directions.delete(direction);
  } else {
    directions.add(direction);
  }
  render();
};

const containerClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const container = document.querySelector('#container') as HTMLElement;
  if (target === container) {
    selectedItemId = undefined;
  } else if (target.className === 'item') {
    selectedItemId = target.id;
  }
  render();
};

const demoContainer = document.querySelector('#demo') as HTMLElement;

const render = () => {
  const item = selectedItemId == undefined ? undefined : items[selectedItemId];
  const bounds = item && (item.bounds as BoundsRect);
  renderLit(
    html`
      <style>
        body {
          font-family: Arial, Sans Serif;
        }
        #container {
          position: relative;
          height: 400px;
          background: #ffd;
          margin: 16px;
          border: solid 1px gray;
          box-sizing: border-box;
        }
        p {
          max-width: 800px;
        }
        label {
          padding: 2px 8px;
        }
        label + label {
          border-left: solid 1px gray;
        }
        #item-1 {
          position: absolute;
          background: blue;
        }
        #item-2 {
          position: absolute;
          background: red;
          border-radius: 20px;
        }
        ignition-selector {
          z-index: 1;
        }
      </style>
      <h1>&lt;ignition-selector&gt; Demo</h1>
      <p>
        &lt;ignition-selector&gt; is responsible for drawing a resizable
        bounding box that can be drawn on top of editable elements to move and
        resize them.
      </p>
      <p>
        The resize handles can be configured by setting the
        <code>directions</code>
        property. Try toggling directions below:
      </p>
      <div>
        ${ResizeDirection.ALL_DIRECTIONS.map(
          (d) => html`
            <label>
              <input
                type="checkbox"
                .checked=${directions.has(ResizeDirection.getDirection(d.name))}
                @change=${() => toggleDirection(d.name)}
              />
              ${d.name}
            </label>
          `
        )}
      </div>
      <p>
        A selection does not resize or move itself, but only fires events. The
        bounds of the selection is controlled with the
        <code>bounds</code> property, which is currently:
        <pre><code>
top: ${bounds?.top}
left: ${bounds?.left}
width: ${bounds?.width}
height: ${bounds?.height}
        </code></pre>
      </p>
      <div id="container" @click=${containerClick}>
        <ignition-selector
          .directions=${[...directions]}
          .bounds=${bounds}
          showorigin
          @selector-resize=${onBoundsChange}
          @selector-move=${onBoundsChange}
        >
        </ignition-selector>
        <div id="item-1" class="item" style="${getItemStyle('item-1')}"></div>
        <div id="item-2" class="item" style="${getItemStyle('item-2')}"></div>
      </div>
    `,
    demoContainer
  );
};

render();
