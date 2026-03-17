import {html} from 'lit';
import {renderThunked, render as _render} from '../../../lib/render.js';
import {collectResult, collectResultSync} from '../../../lib/render-result.js';

import './simple-greeting.js';

export interface RenderData {
  name: string;
}

export function render(data: string): string {
  const payload = JSON.parse(data) as RenderData;
  return collectResultSync(
    renderThunked(html`
      <div>
        <simple-greeting name="${payload.name}"></simple-greeting>
      </div>
    `)
  );
}

async function renderAsyncInternal(data: RenderData): Promise<string> {
  return await collectResult(
    renderThunked(html`
      <div>
        <simple-greeting name="${data.name}"></simple-greeting>
      </div>
    `)
  );
}

export function renderAsync(
  data: string,
  callback: (error: string | null, value: string) => void
) {
  const payload = JSON.parse(data) as RenderData;
  renderAsyncInternal(payload).then(
    (result) => callback(null, result),
    (error: unknown) => callback(String(error), '')
  );
}

async function renderIteratorInternal(
  data: RenderData,
  callback: (error: string | null, value: string | null) => void
) {
  const iterator = _render(html`
    <div>
      <simple-greeting name="${data.name}"></simple-greeting>
    </div>
  `);
  for await (const chunk of iterator) {
    callback(null, chunk as string);
  }
  callback(null, null);
}

export function renderIterator(
  data: string,
  callback: (error: string | null, value: string | null) => void
) {
  const payload = JSON.parse(data) as RenderData;
  renderIteratorInternal(payload, callback).catch((error: unknown) =>
    callback(String(error), null)
  );
}
