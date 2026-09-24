/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {collectResultSync} from '../../lib/render-result.js';
import {createShadowRealm, renderThunked} from '../../shadow-realm.js';
import {html} from 'lit';

test.before.each((context) => {
  console.time(context.__test__);
});

test.after.each((context) => {
  console.timeEnd(context.__test__);
});

test('ShadowRealm render simple greeting', async () => {
  const shadowRealm = await createShadowRealm({
    modules: [
      new URL('../test-files/shadowrealm/simple-greeting.js', import.meta.url)
        .href,
    ],
  });
  console.log(
    (
      shadowRealm as unknown as {
        renderThunked: (value: string) => unknown;
      }
    ).renderThunked
  );
  const payload = {name: 'World!'};
  const result = collectResultSync(
    renderThunked(
      html`
        <div>
          <simple-greeting name="${payload.name}"></simple-greeting>
        </div>
      `,
      shadowRealm
    )
  );
  assert.equal(
    result,
    `<!--lit-part pcttL59/lIs=-->
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

test.run();
