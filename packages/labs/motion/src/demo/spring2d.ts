/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  LitElement,
  html,
  type ReactiveController,
  type ReactiveControllerHost,
} from 'lit';
import {styleMap} from 'lit/directives/style-map.js';
import {customElement} from 'lit/decorators.js';

import {styles} from './styles.css.js';
import {SpringController2D, type Position2D} from '../spring.js';

export class MouseController implements ReactiveController {
  host;
  position: Position2D = {x: 0, y: 0};

  private _onMouseMove = ({clientX, clientY}: MouseEvent) => {
    this.position = {x: clientX, y: clientY};
    this.host.requestUpdate();
  };

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    window.addEventListener('mousemove', this._onMouseMove);
  }

  hostDisconnected() {
    window.removeEventListener('mousemove', this._onMouseMove);
  }
}

const slow = {
  stiffness: 400,
  damping: 500,
  mass: 10,
};

const fast = {
  stiffness: 1200,
  damping: 400,
};

const positionStyle = ({x, y}: Position2D) =>
  styleMap({
    transform: `translate3d(${x}px,${y}px,0) translate3d(-50%,-50%,0)`,
  });

@customElement('goo-element')
export class GooElement extends LitElement {
  static override styles = styles;

  _mouse = new MouseController(this);
  _spring1 = new SpringController2D(this, fast);
  _spring2 = new SpringController2D(this, slow);
  _spring3 = new SpringController2D(this, slow);

  override render() {
    // This is the chain of updates starting with the current mouse position and
    // flowing through each spring
    this._spring1.toPosition = this._mouse.position;
    this._spring2.toPosition = this._spring1.currentPosition;
    this._spring3.toPosition = this._spring2.currentPosition;

    return html`
      <svg style="position: absolute; width: 0; height: 0">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="30" />
          <feColorMatrix
            in="blur"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 30 -7"
          />
        </filter>
      </svg>
      <div class="hooks-main">
        <div class="hooks-filter">
          <div
            class="b1"
            style=${positionStyle(this._spring3.currentPosition)}
          ></div>
          <div
            class="b2"
            style=${positionStyle(this._spring2.currentPosition)}
          ></div>
          <div
            class="b3"
            style=${positionStyle(this._spring1.currentPosition)}
          ></div>
        </div>
      </div>
    `;
  }
}
