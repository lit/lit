/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {consume} from '@lit/context';
import type {Remote} from 'comlink';
import {LitElement, css, html, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import type {
  ApiToWebview,
  BoundingBoxWithDepth,
  ElementInfo,
} from '../../frame/iframe-api-to-webview.js';
import '../../ignition-selector.js';
import {ResizeDirection} from '../../resize-direction.js';
import type {IgnitionStage} from '../ignition-stage.js';
import {frameApiContext, stageContext} from './editor-mode.js';

const colors = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#800080',
  '#da6ab8',
  '#00ffff',
];

/**
 * The initial mode of the stage, which is awaiting a selection.
 */
@customElement('ignition-mode-select')
export class SelectMode extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      inset: 0;
    }
  `;

  @consume({context: stageContext, subscribe: true})
  @state()
  _stage?: IgnitionStage;

  @consume({context: frameApiContext, subscribe: true})
  frameApi?: Remote<ApiToWebview>;

  @property({attribute: false})
  boxesInPageToHighlight: BoundingBoxWithDepth[] = [];

  @property({type: Boolean, attribute: false})
  showHighlights = true;

  @property({attribute: false})
  selectedElement: ElementInfo | undefined;

  constructor() {
    super();
    this.addEventListener('mousemove', this.#onStageMouseMove);
    this.addEventListener('mouseout', this.#onStageMouseOut);
    this.addEventListener('click', this.#onStageClick);
  }

  render() {
    return html` ${this.showHighlights
      ? html` <div>
          ${this.boxesInPageToHighlight.map((bbd) => {
            const bb = bbd.boundingBox;
            const inset = `top: ${bb.y}px; left: ${bb.x}px; height: ${bb.height}px; width: ${bb.width}px`;
            const color = colors[bbd.depth % colors.length];
            return html`<div
              style="position: absolute; ${inset}; border: 1px solid ${color};"
            ></div>`;
          })}
        </div>`
      : nothing}
    ${this.selectedElement?.kind === 'element'
      ? html`<ignition-selector
          .bounds=${this.selectedElement.bounds}
          .directions=${getResizeDirectionsForDisplay(
            this.selectedElement.display
          )}
        ></ignition-selector>`
      : nothing}`;
  }

  #mouseMoveId = 0;
  async #onStageMouseMove(mouseEvent: MouseEvent) {
    if (this.frameApi == null) {
      return;
    }
    const id = ++this.#mouseMoveId;
    const stage = mouseEvent.target as HTMLElementTagNameMap['ignition-stage'];
    const windowX = mouseEvent.clientX;
    const windowY = mouseEvent.clientY;
    // Convert the mouse position to the stage's coordinate space.
    const stageRect = stage.getBoundingClientRect();
    const x = windowX - stageRect.left;
    const y = windowY - stageRect.top;
    const boxes = await this.frameApi.boundingBoxesAtPoint(x, y);
    // Handle race conditions
    if (id !== this.#mouseMoveId) {
      return;
    }
    this.boxesInPageToHighlight = boxes;
  }

  async #onStageClick(mouseEvent: MouseEvent) {
    if (this.frameApi == null) {
      // await this.#frameApiChanged.promise;
      console.log('onStageClick: No frame API');
      return;
    }
    const stage = mouseEvent.target as HTMLElementTagNameMap['ignition-stage'];
    const stageRect = stage.getBoundingClientRect();
    const x = mouseEvent.clientX - stageRect.left;
    const y = mouseEvent.clientY - stageRect.top;
    const elementInfo = await this.frameApi.getElementAtPoint(x, y);
    this.selectedElement = elementInfo;
  }

  #onStageMouseOut() {
    this.boxesInPageToHighlight = [];
  }
}

const getResizeDirectionsForDisplay = (display: string) => {
  if (display === 'block') {
    return ResizeDirection.ALL_DIRECTIONS;
  }
  if (display === 'inline') {
    ResizeDirection.WIDTH_HEIGHT;
  }
  return [];
};

declare global {
  interface HTMLElementTagNameMap {
    'ignition-mode-select': SelectMode;
  }
}
