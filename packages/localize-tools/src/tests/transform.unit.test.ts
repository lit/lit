/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litLocalizeTransform} from '../modes/transform.js';
import * as ts from 'typescript';
import {Message, makeMessageIdMap} from '../messages.js';
import test, {Test} from 'tape';
import prettier from 'prettier';
import {compileTsFragment, CompilerHostCache} from './compile-ts-fragment.js';

const cache = new CompilerHostCache();
const IMPORT_MSG = `import { msg, str } from "@lit/localize";\n`;
const IMPORT_LIT_HTML = `import { html } from "lit-html";\n`;

/**
 * Compile the given fragment of TypeScript source code using the lit-localize
 * litLocalizeTransformer with the given translations. Check that there are no errors and
 * that the output matches (prettier-formatted).
 */
function checkTransform(
  t: Test,
  inputTs: string,
  expectedJs: string,
  opts?: {
    messages?: Message[];
    autoImport?: boolean;
    locale?: string;
  }
) {
  if (opts?.autoImport ?? true) {
    // Rather than fuss with imports in all the test cases, this little hack
    // automatically imports for `msg` and `html` (assuming those strings aren't
    // used with any other meanings).
    if (inputTs.includes('msg')) {
      inputTs = IMPORT_MSG + inputTs;
      // Note we don't expect to see the `msg` import in the output JS, since it
      // should be un-used after litLocalizeTransformation.
    }
    if (inputTs.includes('html')) {
      inputTs = IMPORT_LIT_HTML + inputTs;
      expectedJs = IMPORT_LIT_HTML + expectedJs;
    }
  }
  const options = ts.getDefaultCompilerOptions();
  options.target = ts.ScriptTarget.ES2015;
  options.module = ts.ModuleKind.ESNext;
  options.moduleResolution = ts.ModuleResolutionKind.NodeJs;
  // Don't automatically load typings from nodes_modules/@types, we're not using
  // them here, so it's a waste of time.
  options.typeRoots = [];
  const result = compileTsFragment(inputTs, options, cache, (program) => ({
    before: [
      litLocalizeTransform(
        makeMessageIdMap(opts?.messages ?? []),
        opts?.locale ?? 'en',
        program
      ),
    ],
  }));

  let formattedExpected = prettier.format(expectedJs, {parser: 'typescript'});
  // TypeScript >= 4 will add an empty export statement if there are no imports
  // or exports to ensure this is a module. We don't care about checking this.
  const unformattedActual = (result.code || '').replace('export {};', '');
  let formattedActual;
  try {
    formattedActual = prettier.format(unformattedActual, {
      parser: 'typescript',
    });
  } catch {
    // We might emit invalid TypeScript in a failing test. Rather than fail with
    // a Prettier parse exception, it's more useful to see a diff.
    formattedExpected = expectedJs;
    formattedActual = unformattedActual;
  }
  t.is(formattedActual, formattedExpected);
  t.deepEqual(result.diagnostics, []);
  t.end();
}

test('unchanged const', (t) => {
  const src = 'const foo = "foo";';
  checkTransform(t, src, src);
});

test('unchanged html', (t) => {
  const src =
    'const foo = "foo"; const bar = "bar"; html`Hello ${foo} and ${bar}!`;';
  checkTransform(t, src, src);
});

test('msg(string)', (t) => {
  checkTransform(t, 'msg("Hello World", {id: "foo"});', '"Hello World";');
});

test('msg(string) unnecessarily tagged with str', (t) => {
  checkTransform(t, 'msg(str`Hello World`, {id: "foo"});', '`Hello World`;');
});

test('msg(string) translated', (t) => {
  checkTransform(t, 'msg("Hello World", {id: "foo"});', '`Hola Mundo`;', {
    messages: [{name: 'foo', contents: ['Hola Mundo']}],
  });
});

test('html(msg(string))', (t) => {
  checkTransform(
    t,
    'html`<b>${msg("Hello World", {id: "foo"})}</b>`;',
    'html`<b>Hello World</b>`;'
  );
});

test('html(msg(string)) translated', (t) => {
  checkTransform(
    t,
    'html`<b>${msg("Hello World", {id: "foo"})}</b>`;',
    'html`<b>Hola Mundo</b>`;',
    {messages: [{name: 'foo', contents: ['Hola Mundo']}]}
  );
});

test('html(msg(html))', (t) => {
  checkTransform(
    t,
    'html`<b>${msg(html`Hello <i>World</i>`, {id: "foo"})}</b>`;',
    'html`<b>Hello <i>World</i></b>`;'
  );
});

test('html(msg(html)) translated', (t) => {
  checkTransform(
    t,
    'html`<b>${msg(html`Hello <i>World</i>`, {id: "foo"})}</b>`;',
    'html`<b>Hola <i>Mundo</i></b>`;',
    {
      messages: [
        {
          name: 'foo',
          contents: [
            'Hola ',
            {untranslatable: '<i>'},
            'Mundo',
            {untranslatable: '</i>'},
          ],
        },
      ],
    }
  );
});

test('msg(string(expr))', (t) => {
  checkTransform(
    t,
    'const name = "World";' + 'msg(str`Hello ${name}!`, {id: "foo"});',
    'const name = "World";' + '`Hello ${name}!`;'
  );
});

test('msg(string(expr)) translated', (t) => {
  checkTransform(
    t,
    'const name = "World";' + 'msg(str`Hello ${name}!`, {id: "foo"});',
    'const name = "World";' + '`Hola ${name}!`;',
    {
      messages: [
        {
          name: 'foo',
          contents: ['Hola ', {untranslatable: '${name}'}, '!'],
        },
      ],
    }
  );
});

test('msg(string(string))', (t) => {
  checkTransform(
    t,
    'msg(str`Hello ${"World"}!`, {id: "foo"});',
    '`Hello World!`;'
  );
});

test('msg(string(string)) translated', (t) => {
  checkTransform(
    t,
    'msg(str`Hello ${"World"}!`, {id: "foo"});',
    '`Hola World!`;',
    {
      messages: [
        {
          name: 'foo',
          contents: ['Hola ', {untranslatable: '${"World"}'}, '!'],
        },
      ],
    }
  );
});

test('msg(html(expr))', (t) => {
  checkTransform(
    t,
    'const name = "World";' + 'msg(html`Hello <b>${name}</b>!`, {id: "foo"});',
    'const name = "World";' + 'html`Hello <b>${name}</b>!`;'
  );
});

test('msg(html(expr)) translated', (t) => {
  checkTransform(
    t,
    'const name = "World";' + 'msg(html`Hello <b>${name}</b>!`, {id: "foo"});',
    'const name = "World";' + 'html`Hola <b>${name}</b>!`;',
    {
      messages: [
        {
          name: 'foo',
          contents: ['Hola ', {untranslatable: '<b>${name}</b>'}, '!'],
        },
      ],
    }
  );
});

test('msg(html(string))', (t) => {
  checkTransform(
    t,
    'msg(html`Hello <b>${"World"}</b>!`, {id: "foo"});',
    'html`Hello <b>World</b>!`;'
  );
});

test('msg(html(string)) translated', (t) => {
  checkTransform(
    t,
    'msg(html`Hello <b>${"World"}</b>!`, {id: "foo"});',
    'html`Hola <b>World</b>!`;',
    {
      messages: [
        {
          name: 'foo',
          contents: ['Hola ', {untranslatable: '<b>${"World"}</b>'}, '!'],
        },
      ],
    }
  );
});

test('msg(html(html))', (t) => {
  checkTransform(
    t,
    'msg(html`Hello <b>${html`<i>World</i>`}</b>!`, {id: "foo"});',
    'html`Hello <b><i>World</i></b>!`;'
  );
});

test('msg(html(html)) translated', (t) => {
  checkTransform(
    t,
    'msg(html`Hello <b>${html`<i>World</i>`}</b>!`, {id: "foo"});',
    'html`Hola <b><i>World</i></b>!`;',
    {
      messages: [
        {
          name: 'foo',
          contents: [
            'Hola ',
            {untranslatable: '<b>${html`<i>World</i>`}</b>'},
            '!',
          ],
        },
      ],
    }
  );
});

test('msg(string(msg(string)))', (t) => {
  checkTransform(
    t,
    'msg(str`Hello ${msg("World", {id: "bar"})}!`, {id: "foo"});',
    '`Hello World!`;'
  );
});

test('msg(string(msg(string))) translated', (t) => {
  checkTransform(
    t,
    'msg(str`Hello ${msg("World", {id: "bar"})}!`, {id: "foo"});',
    '`Hola Mundo!`;',
    {
      messages: [
        {
          name: 'foo',
          contents: [
            'Hola ',
            {untranslatable: '${msg("World", {id: "bar"})}'},
            '!',
          ],
        },
        {
          name: 'bar',
          contents: ['Mundo'],
        },
      ],
    }
  );
});

test('msg(string(<b>msg(string)</b>)) translated', (t) => {
  checkTransform(
    t,
    'msg(str`Hello <b>${msg("World", {id: "bar"})}</b>!`, {id: "foo"});',
    '`Hola <b>Mundo</b>!`;',
    {
      messages: [
        {
          name: 'foo',
          contents: [
            'Hola ',
            {untranslatable: '<b>${msg("World", {id: "bar"})}</b>'},
            '!',
          ],
        },
        {
          name: 'bar',
          contents: ['Mundo'],
        },
      ],
    }
  );
});

test('import * as litLocalize', (t) => {
  checkTransform(
    t,
    `
    import * as litLocalize from '@lit/localize';
    litLocalize.msg("Hello World", {id: "foo"});
  `,
    '"Hello World";',
    {autoImport: false}
  );
});

test('import {msg as foo}', (t) => {
  checkTransform(
    t,
    `
    import {msg as foo} from '@lit/localize';
    foo("Hello World", {id: "foo"});
  `,
    '"Hello World";',
    {autoImport: false}
  );
});

test('exclude different msg function', (t) => {
  checkTransform(
    t,
    `function msg(template: string, options?: {id?: string}) { return template; }
    msg("Hello World", {id: "foo"});`,
    `function msg(template, options) { return template; }
    msg("Hello World", {id: "foo"});`,
    {autoImport: false}
  );
});

test('configureTransformLocalization() -> {getLocale: () => "es-419"}', (t) => {
  checkTransform(
    t,
    `import {configureTransformLocalization} from '@lit/localize';
     const {getLocale} = configureTransformLocalization({
       sourceLocale: 'en',
     });
     const locale = getLocale();`,
    `const {getLocale} = {getLocale: () => 'es-419'};
     const locale = getLocale();`,
    {locale: 'es-419'}
  );
});

test('configureLocalization() throws', (t) => {
  t.throws(
    () =>
      checkTransform(
        t,
        `import {configureLocalization} from '@lit/localize';
         configureLocalization({
           sourceLocale: 'en',
           targetLocales: ['es-419'],
           loadLocale: (locale: string) => import(\`/\${locale}.js\`),
         });`,
        ``
      ),
    'Cannot use configureLocalization in transform mode'
  );
  t.end();
});

test('LOCALE_STATUS_EVENT => "lit-localize-status"', (t) => {
  checkTransform(
    t,
    `import {LOCALE_STATUS_EVENT} from '@lit/localize';
     window.addEventListener(LOCALE_STATUS_EVENT, () => console.log('ok'));`,
    `window.addEventListener('lit-localize-status', () => console.log('ok'));`
  );
});

test('litLocalize.LOCALE_STATUS_EVENT => "lit-localize-status"', (t) => {
  checkTransform(
    t,
    `import * as litLocalize from '@lit/localize';
     window.addEventListener(litLocalize.LOCALE_STATUS_EVENT, () => console.log('ok'));`,
    `window.addEventListener('lit-localize-status', () => console.log('ok'));`
  );
});

test('re-assigned LOCALE_STATUS_EVENT', (t) => {
  checkTransform(
    t,
    `import {LOCALE_STATUS_EVENT} from '@lit/localize';
     const event = LOCALE_STATUS_EVENT;
     window.addEventListener(event, () => console.log('ok'));`,
    `const event = 'lit-localize-status';
     window.addEventListener(event, () => console.log('ok'));`
  );
});

test('different LOCALE_STATUS_EVENT variable unchanged', (t) => {
  checkTransform(
    t,
    `const LOCALE_STATUS_EVENT = "x";`,
    `const LOCALE_STATUS_EVENT = "x";`
  );
});

test('different variable cast to "lit-localize-status" unchanged', (t) => {
  checkTransform(
    t,
    `const x = "x" as "lit-localize-status";`,
    `const x = "x";`
  );
});

test('Localized(LitElement) -> LitElement', (t) => {
  checkTransform(
    t,
    `import {LitElement, html} from 'lit-element';
     import {Localized} from '@lit/localize/localized-element.js';
     import {msg} from '@lit/localize';
     class MyElement extends Localized(LitElement) {
       render() {
         return html\`<b>\${msg('Hello World!', {id: 'greeting'})}</b>\`;
       }
     }`,
    `import {LitElement, html} from 'lit-element';
     class MyElement extends LitElement {
       render() {
         return html\`<b>Hello World!</b>\`;
       }
     }`,
    {autoImport: false}
  );
});
