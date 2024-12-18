/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  css,
  CSSResult,
  unsafeCSS,
  supportsAdoptingStyleSheets,
  adoptStyles,
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

    test('`adoptStyles uses different cached `styleSheets` per document', async () => {
      if (supportsAdoptingStyleSheets) {
        const div = document.createElement('div');
        document.body.appendChild(div);
        const shadowRoot = div.attachShadow({mode: 'open'});
        const styles = [
          css`
            div {
              margin: 2px solid red;
            }
          `,
          css`
            div {
              padding: 10px;
            }
          `,
        ];
        adoptStyles(shadowRoot, styles);
        const adoptedStyleSheets_1 = shadowRoot.adoptedStyleSheets;
        adoptStyles(shadowRoot, styles);
        const adoptedStyleSheets_2 = shadowRoot.adoptedStyleSheets;
        assert.notStrictEqual(adoptedStyleSheets_1, adoptedStyleSheets_2);
        adoptedStyleSheets_1.forEach((_, index) => {
          assert.strictEqual(
            adoptedStyleSheets_1[index],
            adoptedStyleSheets_2[index]
          );
        });
        const iframe = document.createElement('iframe');
        const html = '<body>Foo</body>';
        document.body.appendChild(iframe);
        iframe.contentWindow?.document.open();
        iframe.contentWindow?.document.write(html);
        iframe.contentWindow?.document.close();
        iframe.onload = function () {
          iframe.contentWindow?.document.body.appendChild(div);
          adoptStyles(shadowRoot, styles);
          const adoptedStyleSheets_3 = shadowRoot.adoptedStyleSheets;
          adoptStyles(shadowRoot, styles);
          const adoptedStyleSheets_4 = shadowRoot.adoptedStyleSheets;
          assert.notStrictEqual(adoptedStyleSheets_3, adoptedStyleSheets_4);
          adoptedStyleSheets_1.forEach((_, index) => {
            assert.strictEqual(
              adoptedStyleSheets_3[index],
              adoptedStyleSheets_4[index]
            );
          });
          assert.notStrictEqual(adoptedStyleSheets_2, adoptedStyleSheets_3);
          adoptedStyleSheets_1.forEach((_, index) => {
            assert.notStrictEqual(
              adoptedStyleSheets_2[index],
              adoptedStyleSheets_3[index]
            );
          });
        };
      }
    });
  });
});
