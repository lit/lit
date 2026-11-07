/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {relative} from 'path';
import {fileURLToPath} from 'url';
import {createShadowRealm} from '../../lib/shadow-realm/shadow-realm.js';

function toSpecifier(specifier: string) {
  return `./${relative(process.cwd(), fileURLToPath(new URL(specifier, import.meta.url)))}`;
}

test.before.each((context) => {
  console.time(context.__test__);
});

test.after.each((context) => {
  console.timeEnd(context.__test__);
});

test('create ShadowRealm', () => {
  const shadowRealm = new ShadowRealm();
  assert.instance(shadowRealm, ShadowRealm);
});

test('create shimmed ShadowRealm', async () => {
  const shadowRealm = await createShadowRealm();
  assert.instance(shadowRealm, ShadowRealm);
});

test('ShadowRealm render simple greeting', async () => {
  const shadowRealm = await createShadowRealm();
  const render = (await shadowRealm.importValue(
    toSpecifier('../test-files/shadowrealm/render.js'),
    'render'
  )) as (data: string) => string;
  const result = render(JSON.stringify({name: 'World!'}));
  assert.equal(
    result,
    `<!--lit-part JV/ph7+UdTw=-->
      <div>
        <!--lit-node 1--><simple-greeting  name="World!"><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part EvGichL14uw=--><p>Hello, <!--lit-part-->World!<!--/lit-part-->!</p><!--/lit-part--></template></simple-greeting>
      </div>
    <!--/lit-part-->`
  );
});

test('ShadowRealm render simple greeting async', async () => {
  const shadowRealm = await createShadowRealm();
  const renderAsync = (await shadowRealm.importValue(
    toSpecifier('../test-files/shadowrealm/render.js'),
    'renderAsync'
  )) as (
    data: string,
    callback: (error: string | null, value: string) => void
  ) => void;

  const result = await new Promise((resolve, reject) => {
    renderAsync(JSON.stringify({name: 'async World!'}), (error, value) => {
      if (error !== null) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  });

  assert.equal(
    result,
    `<!--lit-part JV/ph7+UdTw=-->
      <div>
        <!--lit-node 1--><simple-greeting  name="async World!"><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part EvGichL14uw=--><p>Hello, <!--lit-part-->async World!<!--/lit-part-->!</p><!--/lit-part--></template></simple-greeting>
      </div>
    <!--/lit-part-->`
  );
});

test('ShadowRealm render simple greeting iterator', async () => {
  const shadowRealm = await createShadowRealm();
  const renderIterator = (await shadowRealm.importValue(
    toSpecifier('../test-files/shadowrealm/render.js'),
    'renderIterator'
  )) as (
    data: string,
    callback: (error: string | null, value: string | null) => void
  ) => void;

  const result = await new Promise((resolve, reject) => {
    let result = '';
    const callback = (error: string | null, value: string | null) => {
      if (error !== null) {
        reject(error);
      } else if (value !== null) {
        result += value;
      } else {
        resolve(result);
      }
    };

    renderIterator(JSON.stringify({name: 'iterator World!'}), callback);
  });

  assert.equal(
    result,
    `<!--lit-part pXlNvZ9gkcE=-->
    <div>
      <!--lit-node 1--><simple-greeting  name="iterator World!"><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part EvGichL14uw=--><p>Hello, <!--lit-part-->iterator World!<!--/lit-part-->!</p><!--/lit-part--></template></simple-greeting>
    </div>
  <!--/lit-part-->`
  );
});

test.run();
