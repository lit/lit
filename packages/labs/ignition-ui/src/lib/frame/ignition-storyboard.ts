/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Task} from '@lit/task';
import type {StoryModule} from '../protocol/component-story-format.js';
import './ignition-story.js';

/**
 * Displays multiple stories from a stories file.
 */
@customElement('ignition-storyboard')
export class IgnitionStoryboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Only matters for non-absolutely positioned stories */
      margin: 8px;

      /* TODO: Get size and position from story module metadata */
      width: 100%;
      height: 100%;
    }
  `;

  @property()
  src?: string;

  #importStoryTask = new Task(this, {
    task: async ([src]) => {
      const mod = src && (await import(src));
      return mod;
    },
    args: () => [this.src],
  });

  render() {
    return html`
      ${this.#importStoryTask.render({
        complete: (mod: StoryModule<unknown>) => {
          return Object.keys(mod)
            .filter((exportName) => {
              // TODO (justinfagnani): respect CSF includeStories and
              // excludeStories
              return exportName !== 'default';
            })
            .map((storyName) => {
              return html`
                <ignition-story
                  .storyModule=${mod}
                  .storyName=${storyName}
                ></ignition-story>
              `;
            });
        },
        pending: () => {
          return html`<h3>Loading stories...</h3>`;
        },
        error: (error) => {
          return html`<h3>Error: ${error}</h3>`;
        },
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-storyboard': IgnitionStoryboard;
  }
}
