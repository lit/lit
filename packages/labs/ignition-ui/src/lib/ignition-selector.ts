/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {css, html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {locate, Point2D, scale, translate} from './math.js';
import {DraggableController} from './draggable-controller.js';
import {DirectionName, ResizeDirection} from './resize-direction.js';
export * from './resize-direction.js';

// TODO: move to math?
export interface BoundsRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SelectionMoveEventInit {
  bounds: BoundsRect;

  /**
   * The client coordinates of the mouse.
   */
  cursor: {x: number; y: number};
}

export type SelectorEventType = 'selector-move' | 'selector-resize';

/**
 * Fired when the selection is moved.
 *
 * @event selector-move
 */
export class SelectionMoveEvent extends Event {
  // TODO: the event needs to send which dimensions actually changed
  static move(init: SelectionMoveEventInit) {
    return new SelectionMoveEvent('selector-move', init);
  }

  static resize(init: SelectionMoveEventInit) {
    return new SelectionMoveEvent('selector-resize', init);
  }

  bounds: BoundsRect;

  cursor: {x: number; y: number};

  constructor(type: SelectorEventType, init: SelectionMoveEventInit) {
    super(type);
    ({bounds: this.bounds, cursor: this.cursor} = init);
  }
}

/**
 * Fired when a mousedown event occurs on the selection.
 *
 * @event selector-mousedown
 */
// TODO: extend MouseEvent
export class SelectionMouseDownEvent extends Event {
  static readonly eventName = 'selector-mousedown';

  declare target: IgnitionSelector;

  constructor() {
    super(SelectionMouseDownEvent.eventName);
  }
}

/**
 * A draggable, resizable widget for displaying the selection state of
 * a GUI editor.
 *
 * @fires selector-move
 * @fires selector-mousedown
 * @fires selector-resize
 */
@customElement('ignition-selector')
export class IgnitionSelector extends LitElement {
  declare addEventListener: {
    (
      type: SelectorEventType,
      listener: (this: IgnitionSelector, ev: SelectionMoveEvent) => unknown,
      options?: boolean | AddEventListenerOptions
    ): void;
  } & HTMLElement['addEventListener'];

  static styles = css`
    :host {
      position: absolute;
      box-sizing: border-box;
    }
    #bounds {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(128, 128, 255, 0.5);
      border: solid 1px #88f;
      box-sizing: border-box;
    }
    .handle {
      position: absolute;
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border: solid 1px #88f;
      background: #fff;
      outline: none;
    }
    .handle:hover {
      background: #88f;
    }
    #top {
      top: -4px;
      left: calc(50% - 4px);
      cursor: ns-resize;
    }
    #left {
      top: calc(50% - 4px);
      left: -4px;
      cursor: ew-resize;
    }
    #bottom {
      bottom: -4px;
      left: calc(50% - 4px);
      cursor: ns-resize;
    }
    #right {
      top: calc(50% - 4px);
      right: -4px;
      cursor: ew-resize;
    }
    #top_left {
      top: -4px;
      left: -4px;
      cursor: nwse-resize;
    }
    #top_right {
      top: -4px;
      right: -4px;
      cursor: nesw-resize;
    }
    #bottom_left {
      bottom: -4px;
      left: -4px;
      cursor: nesw-resize;
    }
    #bottom_right {
      bottom: -4px;
      right: -4px;
      cursor: nwse-resize;
    }
  `;

  /**
   * The set of resize handles to display.
   */
  @property({
    attribute: false,
  })
  directions?: ResizeDirection[];

  /**
   * The current bounding rect.
   */
  @property({
    attribute: false,
    hasChanged() {
      return true;
    },
  })
  bounds?: BoundsRect;

  @query('#bounds')
  private _boundsElement!: HTMLDivElement;

  _boundsDrag = new DraggableController(this, {
    onStart: () => {
      this._boundsElement.style.cursor = 'move';
      // this.dispatchEvent(new SelectionMouseDownEvent());
      return {
        startX: this.offsetLeft,
        startY: this.offsetTop,
      };
    },
    onMove: (x: number, y: number, e: MouseEvent) => {
      this.dispatchEvent(
        SelectionMoveEvent.move({
          bounds: {
            left: x,
            top: y,
            width: this.offsetWidth,
            height: this.offsetHeight,
          },
          cursor: {
            x: e.clientX,
            y: e.clientY,
          },
        })
      );
    },
    onEnd: (_e: MouseEvent) => {
      this._boundsElement.style.cursor = 'auto';
    },
  });

  _resizeDrag = new DraggableController(this, {
    onStart: (e: MouseEvent) => {
      if (this.bounds === undefined) {
        console.error(
          `ignition-selector bounds is undefined. This shouldn't be possible.`
        );
        return;
      }
      e.stopPropagation();

      const handleName = (e.target as Element).id as DirectionName;
      const direction = ResizeDirection.getDirection(handleName);
      const bounds = {...this.bounds};

      const handlePosition = locate(bounds, direction.location);

      return {
        startX: handlePosition[0],
        startY: handlePosition[1],
        onMove: (mouseX: number, mouseY: number, e: MouseEvent) => {
          const mousePosition = [mouseX, mouseY] as Point2D;
          const [dx, dy] = translate(mousePosition, scale(-1, handlePosition));

          const dw = direction.resizesLeft
            ? -dx
            : direction.resizesRight
              ? dx
              : 0;

          const dh = direction.resizesTop
            ? -dy
            : direction.resizesBottom
              ? dy
              : 0;

          const newBounds = {
            left: direction.resizesLeft ? bounds.left + dx : bounds.left,
            top: direction.resizesTop ? bounds.top + dy : bounds.top,
            width: bounds.width + dw,
            height: bounds.height + dh,
          };

          this.dispatchEvent(
            SelectionMoveEvent.resize({
              bounds: newBounds,
              cursor: {
                x: e.clientX,
                y: e.clientY,
              },
            })
          );
        },
        onEnd: (_e: MouseEvent) => {
          this._boundsElement.style.cursor = 'auto';
        },
      };
    },
  });

  render() {
    const show = !this.hidden && this.bounds !== undefined;
    let hostStyles: string;
    if (show) {
      const bounds = this.bounds!;
      hostStyles = `
        display: block;
        top: ${bounds.top}px;
        left: ${bounds.left}px;
        width: ${bounds.width}px;
        height: ${bounds.height}px;
      `;
    } else {
      hostStyles = `
        display: none;
      `;
    }
    return html`
      <style>
        :host {
          ${hostStyles};
        }
      </style>
      <div
        id="bounds"
        @mousedown=${this._onBoundsDown}
        ${this._boundsDrag.handle()}
      >
        ${this.directions?.map(
          (item) => html`
            <div
              id="${item.name}"
              class="handle"
              tabindex="-1"
              @click=${this._onResizeHandleClick}
              ${this._resizeDrag.handle()}
            ></div>
          `
        )}
      </div>
    `;
  }

  show() {
    this.removeAttribute('hidden');
    this.requestUpdate();
  }

  hide() {
    this.setAttribute('hidden', '');
    this.requestUpdate();
  }

  protected _onResizeHandleClick(e: MouseEvent) {
    e.stopPropagation();
  }

  protected _onBoundsDown(_e: MouseEvent) {
    this.dispatchEvent(new SelectionMouseDownEvent());
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-selector': IgnitionSelector;
  }
}
