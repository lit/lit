/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {ref} from 'lit/directives/ref.js';
import {Task} from '@lit/task';
import type {
  ComponentAnnotations,
  StoryContext,
  WebRenderer,
} from '@storybook/types';
import type {StoryObj} from '@storybook/web-components';


interface PlainWebRenderer extends WebRenderer {
  component: string;
  storyResult: void;
}

type Meta<T> = ComponentAnnotations<PlainWebRenderer, T>;

/**
 * Displays multiple stories from a stories file.
 */
@customElement('ignition-storyboard')
export class IgnitionStoryboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: #4444ff;
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
      <h2>Stories here</h2>
      <h3>src: ${this.src}</h3>
      ${this.#importStoryTask.render({
        complete: (mod: Record<string, unknown>) => {
          const render = (mod.default as Meta<unknown>).render;
          return html`
            <div>Story exports: ${JSON.stringify(Object.keys(mod))}</div>
            <ul>
              ${Object.entries(mod).map(([name, _value]) => {
                if (name === 'default') {
                  return undefined;
                }
                return html`<li>${name}</li>`;
              })}
            </ul>
            ${Object.entries(mod).map(([name, story]) => {
              if (name === 'default') {
                return undefined;
              }
              return html`
                <section>
                  <h3>${name}</h3>
                  <div
                    ${ref((canvasElement?: Element) => {
                      if (canvasElement) {
                        render?.((story as StoryObj).args, {
                          canvasElement: canvasElement as HTMLElement,
                        } as StoryContext<PlainWebRenderer, unknown>);
                      }
                    })}
                  ></div>
                </section>
              `;
            })}
          `;
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
