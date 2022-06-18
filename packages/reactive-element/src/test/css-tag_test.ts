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
} from '../css-tag.js';
import {html, getComputedStyleValue, createShadowRoot} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

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

  suite('adopting styles', () => {
    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    teardown(() => {
      if (container && container.parentNode) {
        container.remove();
      }
    });

    test('adoptStyles sets styles in a shadowRoot', () => {
      const host = document.createElement('host-el');
      container.appendChild(host);
      const root = createShadowRoot(host);
      root.innerHTML = html`<div></div>
        <p></p>`;
      const div = root.querySelector('div')!;
      const p = root.querySelector('p')!;
      adoptStyles(root, [
        css`
          div {
            border: 2px solid black;
          }
        `,
        css`
          p {
            border: 4px solid black;
          }
        `,
      ]);
      assert.equal(getComputedStyleValue(div), '2px');
      assert.equal(getComputedStyleValue(p), '4px');
    });

    test('adoptStyles resets styles in a shadowRoot', () => {
      const host = document.createElement('host-el');
      container.appendChild(host);
      const root = createShadowRoot(host);
      root.innerHTML = html`<div></div>`;
      const div = root.querySelector('div')!;
      adoptStyles(root, [
        css`
          div {
            border: 2px solid black;
          }
        `,
      ]);
      adoptStyles(root, []);
      assert.equal(getComputedStyleValue(div), '0px');
    });

    test('adoptStyles can preserve and add to styles in a shadowRoot', () => {
      const host = document.createElement('host-el');
      container.appendChild(host);
      const root = createShadowRoot(host);
      root.innerHTML = html`<div></div>
        <p></p>`;
      const div = root.querySelector('div')!;
      const p = root.querySelector('p')!;
      adoptStyles(root, [
        css`
          div {
            border: 2px solid black;
          }
        `,
      ]);
      adoptStyles(root, [], true);
      assert.equal(getComputedStyleValue(div), '2px');
      adoptStyles(
        root,
        [
          css`
            div {
              border: 4px solid black;
            }
          `,
        ],
        true
      );
      adoptStyles(
        root,
        [
          css`
            p {
              border: 6px solid black;
            }
          `,
        ],
        true
      );
      assert.equal(getComputedStyleValue(div), '4px');
      assert.equal(getComputedStyleValue(p), '6px');
    });
  });
});
