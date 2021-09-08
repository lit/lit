/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {css, CSSResult, unsafeCSS} from '../css-tag.js';
import {assert} from '@esm-bundle/chai';

suite('Styling', () => {
  suite('css tag', () => {
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

    test('css with same values always produce the same stylesheet', () => {
      // Alias avoids syntax highlighting issues in editors
      const cssValue = css;
      const makeStyle = () => cssValue`background: ${cssValue`blue`}`;
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

    test('unsafeCSS() CSSResults always produce the same stylesheet', () => {
      // Alias avoids syntax highlighting issues in editors
      const makeStyle = () => unsafeCSS(`foo`);
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
        new (CSSResult as any)('throw', Symbol());
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
