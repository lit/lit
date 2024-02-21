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
    }
  `;

  @property({attribute: false})
  storyModule?: StoryModule<unknown>;

  @property()
  storyName?: string;

  render() {
    return html`<ignition-story-container
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
