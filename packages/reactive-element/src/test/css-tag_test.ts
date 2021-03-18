/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {css, CSSResult} from '../css-tag.js';
import {assert} from '@esm-bundle/chai';

suite('Styling', () => {
  suite('css tag', () => {
    test('caches CSSResults with no expressions', () => {
      // Alias avoids syntax highlighting issues in editors
      const cssValue = css;
      const makeStyle = () => cssValue`foo`;
      const style1 = makeStyle();
      const style2 = makeStyle();
      assert.strictEqual(style1, style2);
    });

    test('CSSResults always produce the same stylesheet', () => {
      // Alias avoids syntax highlighting issues in editors
      const cssValue = css;
      const makeStyle = () => cssValue`foo`;
      const style1 = makeStyle();
      assert.equal(
        (style1 as CSSResult).styleSheet,
        (style1 as CSSResult).styleSheet
      );
      const style2 = makeStyle();
      assert.equal(
        (style1 as CSSResult).styleSheet,
        (style2 as CSSResult).styleSheet
      );
    });

    test('caches CSSResults with same-valued expressions', () => {
      const makeStyle = () => css`foo ${1}`;
      const style1 = makeStyle();
      const style2 = makeStyle();
      assert.strictEqual(style1, style2);
    });

    test('does not cache CSSResults with diferent-valued expressions', () => {
      const makeStyle = (x: number) => css`foo ${x}`;
      const style1 = makeStyle(1);
      const style2 = makeStyle(2);
      assert.notStrictEqual(style1, style2);
    });

    test('`css` get styles throws when unsafe values are used', async () => {
      assert.throws(() => {
        css`
          div {
            border: ${`2px solid blue;` as any};
          }
        `;
      });
    });

    test('`css` allows real JavaScript numbers', async () => {
      const spacer = 2;
      // Alias avoids syntax highlighting issues in editors
      const cssValue = css;
      const result = cssValue`
        div {
          margin: ${spacer * 2}px;
        }
      `;
      assert.equal(
        (result as CSSResult).cssText.replace(/\s/g, ''),
        'div{margin:4px;}'
      );
    });

    test('`CSSResult` cannot be constructed', async () => {
      // Note, this is done for security, instead use `css` or `unsafeCSS`
      assert.throws(() => {
        new CSSResult('throw', Symbol());
      });
    });

    test('`CSSResult` allows for String type coercion via toString()', async () => {
      const cssModule = css`
        .my-module {
          color: yellow;
        }
      `;
      // Coercion allows for reusage of css-tag outcomes in regular strings.
      // Example use case: apply cssModule as global page styles at
      // document.body level.
      const bodyStyles = `${cssModule}`;
      assert.equal(bodyStyles.replace(/\s/g, ''), '.my-module{color:yellow;}');
    });
  });
});
