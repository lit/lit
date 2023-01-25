/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {configureSsrLocalization} from '../ssr.js';
import {render} from '@lit-labs/ssr';
import {html} from 'lit';
import {msg} from '@lit/localize';
import {collectResultSync} from '@lit-labs/ssr/lib/render-result.js';

const translations = new Map([
  [
    'es',
    {
      templates: {
        hello: html`Hola`,
        world: html`Mundo`,
      },
    },
  ],
  [
    'nl',
    {
      templates: {
        hello: html`Hallo`,
        world: html`Wereld`,
      },
    },
  ],
]);

const {withLocale} = await configureSsrLocalization({
  sourceLocale: 'en',
  targetLocales: ['es', 'nl'],
  loadLocale: async (locale) => translations.get(locale),
});

const removeHtmlComments = (htmlStr: string) =>
  htmlStr.replace(/<!--.*?-->/g, '');

const randomTimeout = () =>
  new Promise((r) => setTimeout(r, Math.random() * 30));

const renderHelloWorld = (locale: string) =>
  new Promise<string>((resolve) => {
    withLocale(locale, async () => {
      const hello = collectResultSync(render(msg(html`Hello`, {id: 'hello'})));
      // Randomize reentry to simulate concurrent requests to an async server.
      await randomTimeout();
      const world = collectResultSync(render(msg(html`World`, {id: 'world'})));
      resolve(removeHtmlComments(`${hello} ${world}`));
    });
  });

test('renders en in isolation', async () => {
  assert.equal(await renderHelloWorld('en'), 'Hello World');
});

test('renders es in isolation', async () => {
  assert.equal(await renderHelloWorld('es'), 'Hola Mundo');
});

test('renders nl in isolation', async () => {
  assert.equal(await renderHelloWorld('nl'), 'Hallo Wereld');
});

test('renders all 3 locales concurrently', async () => {
  // Run a bunch of times to simulate more concurrency.
  for (let i = 0; i < 10; i++) {
    const en = renderHelloWorld('en');
    const es = renderHelloWorld('es');
    const nl = renderHelloWorld('nl');

    assert.equal(await en, 'Hello World', `[${i}] en`);
    assert.equal(await es, 'Hola Mundo', `[${i}] es`);
    assert.equal(await nl, 'Hallo Wereld', `[${i}] nl`);
  }
});

test.run();
