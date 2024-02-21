/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import './ignition-story-container.js';
import type {StoryModule} from '../protocol/component-story-format.js';

/**
 * Displays a single story from a stories module.
 *
 * This element will eventually contain "chrome" for the story, such as
 * displaying the story name, story code, allowing resizing, positioning, etc.
 */
@customElement('ignition-story')
export class IgnitionStory extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Only matters for non-absolutely positioned stories */
      margin: 8px;
    }
    header {
      display: inline-block;
      border: solid var(--vscode-widget-border, #ccc);
      border-width: 1px 1px 0 1px;
      padding: 4px;
    }
    header > h2 {
      margin: 0;
    }
    ignition-story-container {
      border: 1px solid var(--vscode-widget-border, #ccc);
    }
  `;

  @property({attribute: false})
  storyModule?: StoryModule<unknown>;

  @property()
  storyName?: string;

  render() {
    if (this.storyModule === undefined || this.storyName === undefined) {
      return html`<div>No story module or story name provided</div>`;
    }
    const storyObj = this.storyModule[this.storyName];
    const storyName = storyObj.name || this.storyName;
    const bounds = storyObj.bounds;
    // TODO (justinfagnani): replace this positioning with CSS
    return html` <style>
        ${bounds === undefined
          ? css`
              :host {
                position: static;
              }
            `
          : css`
              :host {
                position: absolute;
                left: ${bounds.left}px;
                top: ${bounds.top}px;
                width: ${bounds.width}px;
                height: ${bounds.height}px;
              }
            `}
      </style>
      <header>
        <h2>${storyName}</h2>
      </header>
      <ignition-story-container
        .storyModule=${this.storyModule}
        .storyName=${this.storyName}
      ></ignition-story-container>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-story': IgnitionStory;
  }
}
