/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  LitElement,
  html,
  type ReactiveController,
  type ReactiveControllerHost,
  css,
} from 'lit';
import {styleMap} from 'lit/directives/style-map.js';
import {customElement, state} from 'lit/decorators.js';

import {SpringController, type Position2D} from '../spring.js';

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

@customElement('spring-demo')
export class SpringDemo extends LitElement {
  static override styles = css`
    :host {
      display: block;
      background: lightgrey;
      padding: 24px;
      box-sizing: border-box;
    }
    #current-value,
    #to-value,
    #from-value {
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 10px;
    }
    #to-value {
      opacity: 50%;
      background: red;
    }
    #from-value {
      opacity: 50%;
      background: blue;
    }
    #current-value {
      background: black;
    }
  `;

  _mouse = new MouseController(this);

  @state()
  _spring = new SpringController(this);

  override render() {
    const {currentValue, toValue, fromValue} = this._spring;
    return html`
      <button @click=${this._go}>Go</button>
      <div
        id="from-value"
        style=${styleMap({
          left: `calc(50% - 10px + ${fromValue * 100}px)`,
          top: `calc(50% - 10px)`,
        })}
      ></div>
      <div
        id="to-value"
        style=${styleMap({
          left: `calc(50% - 10px + ${toValue * 100}px)`,
          top: `calc(50% - 10px)`,
        })}
      ></div>
      <div
        id="current-value"
        style=${styleMap({
          left: `calc(50% - 10px + ${currentValue * 100}px)`,
          top: `calc(50% - 10px)`,
        })}
      ></div>
    `;
  }

  _go() {
    this._spring = new SpringController(this);
  }
}
