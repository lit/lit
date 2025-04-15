import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Task} from '@lit/task';
import init, {parseSync} from '@oxc-parser/wasm';
import {ESTreeTreeAdapter} from '../../../lib/ast/tree-adapters/oxc-estree.js';
import {transformTree} from '../../../lib/ast/transform-tree.js';
import type {ParseResult} from 'oxc-parser';
import './estree-panel.js';

// Initialize the WASM module
const wasmInit = (init as unknown as () => Promise<void>)();

@customElement('output-panel')
export class OutputPanel extends LitElement {
  @property({attribute: false}) source = '';
  @property({type: Number}) selectionStart = 0;
  @state() duration = 0;

  #parseTask = new Task(
    this,
    async ([source]) => {
      if (!source) return null;

      const startTime = performance.now();
      await wasmInit;

      const result = parseSync(source, {
        sourceFilename: 'index.ts',
      }) as unknown as ParseResult;
      const tree = new ESTreeTreeAdapter(result);
      transformTree({
        tree,
        sourceText: source,
        infer: {htmlTag: true, litBindings: true},
      });

      this.duration = Math.round(performance.now() - startTime);

      return result.program.body;
    },
    () => [this.source]
  );

  override render() {
    return html`
      <div class="container">
        <div class="content">
          ${this.#parseTask.render({
            pending: () => html`<div class="loading">Loading...</div>`,
            complete: (result) => html`
              <estree-panel
                .oxc=${result}
                .selectionStart=${this.selectionStart}
              ></estree-panel>
            `,
            error: (error) =>
              html`<div class="error">
                Error: ${error instanceof Error ? error.message : String(error)}
              </div>`,
          })}
        </div>

        <div class="duration">${this.duration} ms</div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }

    .content {
      flex: 1;
      overflow: auto;
      min-height: 0;
      min-width: 0;
    }

    .duration {
      position: absolute;
      bottom: 8px;
      right: 8px;
      opacity: 0.6;
      font-size: 12px;
    }

    .loading {
      padding: 16px;
      text-align: center;
    }

    .error {
      padding: 16px;
      color: red;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'output-panel': OutputPanel;
  }
}
