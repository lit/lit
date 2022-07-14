/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import './dom-shim.js';
import '@lit-labs/ssr/lib/render-lit-html.js';
import {fileURLToPath} from 'url';
import nodePath from 'path';
import {readFile} from 'fs/promises';
import {LitElementRenderer} from '@lit-labs/ssr/lib/lit-element-renderer.js';

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));

const index = (
  await readFile(nodePath.resolve(__dirname, '../index-prod.html'))
).toString();

const indexParts = index.split('<app-root></app-root>');

export const render = async (path: string) => {
  window.location.pathname = path;
  await import(nodePath.resolve(__dirname, '../build/_router.js'));
  const instance = new LitElementRenderer('app-root');

  instance.setAttribute('path', path);
  instance.setProperty('path', path);

  (instance.element as any).routes.goto(path);
  instance.connectedCallback();
  instance.element.requestUpdate();
  await (instance.element as any).routes.currentEntrySuccess;

  return (function* () {
    yield indexParts[0];

    yield `<app-root`;
    yield* instance.renderAttributes();
    yield `>`;
    const shadowContents = instance.renderShadow({
      elementRenderers: [LitElementRenderer],
      customElementInstanceStack: [],
      customElementHostStack: [],
      deferHydration: false,
    });
    if (shadowContents !== undefined) {
      yield '<template shadowroot="open">';
      yield* shadowContents;
      yield '</template>';
    }
    yield `</app-root>`;
    yield indexParts[1];
  })();
};
