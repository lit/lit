/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  adoptStyles,
  css,
  CSSResult,
  unsafeCSS,
  supportsAdoptingStyleSheets,
} from '@lit/reactive-element/css-tag.js';
import {assert} from 'chai';

suite('Styling', () => {
  suite('css tag', () => {
    test('stylesheet from same template literal without expressions are cached', () => {
      // Alias avoids syntax highlighting issues in editors
      const cssValue = css;
      const makeStyle = () => cssValue`foo`;
      const style1 = makeStyle();
      if (supportsAdoptingStyleSheets) {
        assert.isDefined(style1.styleSheet);
        assert.strictEqual(style1.styleSheet, style1.styleSheet);
        const style2 = makeStyle();
        // Equal because we cache stylesheets based on TemplateStringArrays
        assert.strictEqual(style1.styleSheet, style2.styleSheet);
      } else {
        assert.isUndefined(style1.styleSheet);
      }
    });

    test('stylesheet from same template literal with expressions are not cached', () => {
      // Alias avoids syntax highlighting issues in editors
      const cssValue = css;
      const makeStyle = () => cssValue`background: ${cssValue`blue`}`;
      const style1 = makeStyle();
      if (supportsAdoptingStyleSheets) {
        assert.isDefined(style1.styleSheet);
        assert.strictEqual(style1.styleSheet, style1.styleSheet);
        const style2 = makeStyle();
        assert.notStrictEqual(style1.styleSheet, style2.styleSheet);
      } else {
        assert.isUndefined(style1.styleSheet);
      }
    });

    test('unsafeCSS() always produces a new stylesheet', () => {
      const makeStyle = () => unsafeCSS(`foo`);
      const style1 = makeStyle();
      if (supportsAdoptingStyleSheets) {
        assert.isDefined(style1.styleSheet);
        assert.strictEqual(style1.styleSheet, style1.styleSheet);
        const style2 = makeStyle();
        assert.notStrictEqual(style1.styleSheet, style2.styleSheet);
      } else {
        assert.isUndefined(style1.styleSheet);
      }
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
      assert.equal(result.cssText.replace(/\s/g, ''), 'div{margin:4px;}');
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

  suite('adoptStyles', () => {
    test('does not throw when document is undefined (SSR)', () => {
      // When supportsAdoptingStyleSheets is true (modern browsers), the
      // else-branch guard is not reachable. This test only validates the
      // fallback path that runs in environments without adoptedStyleSheets.
      if (supportsAdoptingStyleSheets) {
        // In modern browsers we cannot test the fallback path directly;
        // assert that adoptStyles works via the adoptedStyleSheets path
        // instead as a basic sanity check.
        const container = document.createElement('div');
        const root = container.attachShadow({mode: 'open'});
        const styles = [
          css`
            div {
              color: red;
            }
          `,
        ];
        assert.doesNotThrow(() => adoptStyles(root, styles));
        assert.equal(root.adoptedStyleSheets.length, 1);
      } else {
        // Fallback path: patch `document` to be undefined to simulate SSR.
        const desc = Object.getOwnPropertyDescriptor(globalThis, 'document')!;
        Object.defineProperty(globalThis, 'document', {
          value: undefined,
          configurable: true,
        });
        try {
          const fakeRoot = {} as unknown as ShadowRoot;
          const styles = [
            css`
              div {
                color: red;
              }
            `,
          ];
          // Should silently return without throwing.
          assert.doesNotThrow(() => adoptStyles(fakeRoot, styles));
        } finally {
          Object.defineProperty(globalThis, 'document', desc);
        }
      }
    });
  });
});
