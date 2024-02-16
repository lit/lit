/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {ref} from 'lit/directives/ref.js';
import type {
  PlainWebRenderer,
  StoryContext,
  StoryObj,
  StoryModule,
} from './component-story-format.js';

/**
 * Renders a single story, with no other DOM, from a stories module.
 */
@customElement('ignition-story-container')
export class IgnitionStoryContainer extends LitElement {
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
    if (this.storyModule === undefined || this.storyName === undefined) {
      return;
    }

    const story = this.storyModule[this.storyName];

    if (story === undefined) {
      return;
    }

    const render = this.storyModule.default.render;
    return html`<div
      ${ref((canvasElement?: Element) => {
        if (canvasElement) {
          render?.((story as StoryObj).args, {
            canvasElement: canvasElement as HTMLElement,
          } as StoryContext<PlainWebRenderer, unknown>);
        }
      })}
    ></div> `;
  }
}
