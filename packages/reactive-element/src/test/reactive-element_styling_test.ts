/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  css,
  ReactiveElement,
  unsafeCSS,
  CSSResultGroup,
} from '@lit/reactive-element';

import {
  canTestReactiveElement,
  generateElementName,
  getComputedStyleValue,
  RenderingElement,
  nextFrame,
  html,
} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

(canTestReactiveElement ? suite : suite.skip)('Styling', () => {
  suite('Static get styles', () => {
    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    teardown(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    test('content shadowRoot is styled via static get styles in multiple instances', async () => {
      const name = generateElementName();
      customElements.define(
        name,
        class extends RenderingElement {
          static override get styles() {
            return [
              css`
                div {
                  border: 2px solid blue;
                }
              `,
              css`
                span {
                  display: block;
                  border: 3px solid blue;
                }
              `,
            ];
          }

          override render() {
            return html` <div>Testing1</div>
              <span>Testing2</span>`;
          }
        }
      );
      const testInstance = async () => {
        const el = document.createElement(name);
        container.appendChild(el);
        await (el as ReactiveElement).updateComplete;
        const div = el.shadowRoot!.querySelector('div');
        assert.equal(
          getComputedStyleValue(div!, 'border-top-width').trim(),
          '2px'
        );
        const span = el.shadowRoot!.querySelector('span');
        assert.equal(
          getComputedStyleValue(span!, 'border-top-width').trim(),
          '3px'
        );
      };
      // test multiple instances
      await testInstance();
      await testInstance();
      await testInstance();
    });

    // Test this in Shadow DOM without `adoptedStyleSheets` only since it's easily
    // detectable in that case.
    const testShadowDOMStyleCount =
      (!window.ShadyDOM || !window.ShadyDOM.inUse) &&
      !('adoptedStyleSheets' in Document.prototype);
    (testShadowDOMStyleCount ? test : test.skip)(
      'when an array is returned from `static get styles`, one style is generated per array item',
      async () => {
        const name = generateElementName();
        customElements.define(
          name,
          class extends RenderingElement {
            static override get styles() {
              return [
                css`
                  div {
                    border: 2px solid blue;
                  }
                `,
                css`
                  span {
                    display: block;
                    border: 3px solid blue;
                  }
                `,
              ];
            }

            override render() {
              return html` <div>Testing1</div>
                <span>Testing2</span>`;
            }
          }
        );
        const el = document.createElement(name);
        container.appendChild(el);
        await (el as ReactiveElement).updateComplete;
        assert.equal(el.shadowRoot!.querySelectorAll('style').length, 2);
      }
    );

    test('static get styles can be a single CSSResult', async () => {
      const name = generateElementName();
      customElements.define(
        name,
        class extends RenderingElement {
          static override get styles() {
            return css`
              div {
                border: 2px solid blue;
              }
            `;
          }

          override render() {
            return html` <div>Testing</div>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
    });

    test('static get styles allows composition via `css` values', async () => {
      const name = generateElementName();
      customElements.define(
        name,
        class extends RenderingElement {
          static override get styles() {
            // Alias avoids syntax highlighting issues in editors
            const cssValue = css;
            return [
              css`
                div {
                  border: ${cssValue`2px solid blue`};
                }
              `,
              css`
                span {
                  display: block;
                  border: ${cssValue`3px solid blue`};
                }
              `,
            ];
          }

          override render() {
            return html` <div>Testing1</div>
              <span>Testing2</span>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
      const span = el.shadowRoot!.querySelector('span');
      assert.equal(
        getComputedStyleValue(span!, 'border-top-width').trim(),
        '3px'
      );
    });

    test('Any value can be used in `css` when included with `unsafeCSS`', async () => {
      const name = generateElementName();
      const someVar = `2px solid blue`;
      customElements.define(
        name,
        class extends RenderingElement {
          static override get styles() {
            return css`
              div {
                border: ${unsafeCSS(someVar)};
              }
            `;
          }

          override render() {
            return html` <div>Testing</div>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
    });

    test('unsafeCSS can be used standalone', async () => {
      const name = generateElementName();
      customElements.define(
        name,
        class extends RenderingElement {
          static override get styles() {
            return unsafeCSS('div {border: 2px solid blue}');
          }

          override render() {
            return html` <div>Testing</div>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
    });

    test('`static get styles` applies last instance of style', async () => {
      const name = generateElementName();
      const s1 = css`
        div {
          border: 2px solid blue;
        }
      `;
      const s2 = css`
        div {
          border: 3px solid blue;
        }
      `;
      customElements.define(
        name,
        class extends RenderingElement {
          static override get styles() {
            return [s1, s2, s1];
          }

          override render() {
            return html` <div>Testing1</div>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
    });

    test('`static get styles` array is flattened', async () => {
      const name = generateElementName();
      const styles = [
        css`
          .level1 {
            border: 1px solid blue;
          }
        `,
        [
          css`
            .level2 {
              border: 2px solid blue;
            }
          `,
          [
            css`
              .level3 {
                border: 3px solid blue;
              }
            `,
            [
              css`
                .level4 {
                  border: 4px solid blue;
                }
              `,
            ],
          ],
        ],
      ];
      customElements.define(
        name,
        class extends RenderingElement {
          static override get styles() {
            return [styles];
          }

          override render() {
            return html` <div class="level1">Testing1</div>
              <div class="level2">Testing2</div>
              <div class="level3">Testing3</div>
              <div class="level4">Testing4</div>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const level1 = el.shadowRoot!.querySelector('.level1');
      const level2 = el.shadowRoot!.querySelector('.level2');
      const level3 = el.shadowRoot!.querySelector('.level3');
      const level4 = el.shadowRoot!.querySelector('.level4');
      assert.equal(
        getComputedStyleValue(level1!, 'border-top-width').trim(),
        '1px'
      );
      assert.equal(
        getComputedStyleValue(level2!, 'border-top-width').trim(),
        '2px'
      );
      assert.equal(
        getComputedStyleValue(level3!, 'border-top-width').trim(),
        '3px'
      );
      assert.equal(
        getComputedStyleValue(level4!, 'border-top-width').trim(),
        '4px'
      );
    });

    test('`styles` can be a static field', async () => {
      const name = generateElementName();
      customElements.define(
        name,
        class extends RenderingElement {
          static override styles = [
            css`
              div {
                border: 2px solid blue;
              }
            `,
            css`
              span {
                display: block;
                border: 3px solid blue;
              }
            `,
          ];

          override render() {
            return html` <div>Testing1</div>
              <span>Testing2</span>`;
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
      const span = el.shadowRoot!.querySelector('span');
      assert.equal(
        getComputedStyleValue(span!, 'border-top-width').trim(),
        '3px'
      );
    });

    test('can extend and augment `styles`', async () => {
      const base = generateElementName();
      class BaseClass extends RenderingElement {
        static override get styles() {
          return css`
            div {
              border: 2px solid blue;
            }
          ` as CSSResultGroup;
        }

        override render() {
          return html` <div>Testing1</div>`;
        }
      }
      customElements.define(base, BaseClass);
      const sub = generateElementName();
      customElements.define(
        sub,
        class extends BaseClass {
          static override get styles() {
            return [
              super.styles,
              css`
                span {
                  display: block;
                  border: 3px solid blue;
                }
              `,
            ];
          }

          override render() {
            return html` ${super.render()}
              <span>Testing2</span>`;
          }
        }
      );

      const subsub = generateElementName();
      customElements.define(
        subsub,
        class extends BaseClass {
          static override get styles() {
            return [
              BaseClass.styles,
              css`
                p {
                  display: block;
                  border: 4px solid blue;
                }
              `,
            ];
          }

          override render() {
            return html` ${super.render()}
              <p>Testing3</p>`;
          }
        }
      );
      let el = document.createElement(base);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
      el = document.createElement(sub);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const span = el.shadowRoot!.querySelector('span');
      assert.equal(
        getComputedStyleValue(span!, 'border-top-width').trim(),
        '3px'
      );
      el = document.createElement(subsub);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const p = el.shadowRoot!.querySelector('p');
      assert.equal(getComputedStyleValue(p!, 'border-top-width').trim(), '4px');
    });

    test('can extend and override `styles`', async () => {
      const base = generateElementName();
      class BaseClass extends RenderingElement {
        static override get styles() {
          return css`
            div {
              border: 2px solid blue;
            }
          `;
        }

        override render() {
          return html` <div>Testing1</div>`;
        }
      }
      customElements.define(base, BaseClass);

      const sub = generateElementName();
      customElements.define(
        sub,
        class extends BaseClass {
          static override get styles() {
            return css`
              div {
                border: 3px solid blue;
              }
            `;
          }
        }
      );

      const subsub = generateElementName();
      customElements.define(
        subsub,
        class extends BaseClass {
          static override get styles() {
            return css`
              div {
                border: 4px solid blue;
              }
            `;
          }
        }
      );
      let el = document.createElement(base);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      let div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
      el = document.createElement(sub);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '3px'
      );
      el = document.createElement(subsub);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '4px'
      );
    });

    test('elements should inherit `styles` by default', async () => {
      const base = generateElementName();
      class BaseClass extends RenderingElement {
        static override styles = css`
          div {
            border: 4px solid black;
          }
        `;
      }
      customElements.define(base, BaseClass);

      const sub = generateElementName();
      customElements.define(
        sub,
        class extends BaseClass {
          override render() {
            return html`<div></div>`;
          }
        }
      );

      const el = document.createElement(sub);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      const div = el.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyle(div!).getPropertyValue('border-top-width').trim(),
        '4px'
      );
    });

    test('element class only gathers styles once', async () => {
      const base = generateElementName();
      let getStylesCounter = 0;
      let stylesCounter = 0;
      customElements.define(
        base,
        class extends RenderingElement {
          static override finalizeStyles(styles: CSSResultGroup) {
            getStylesCounter++;
            return super.finalizeStyles(styles);
          }

          static override get styles() {
            stylesCounter++;
            return css`
              :host {
                border: 10px solid black;
              }
            `;
          }
          override render() {
            return html`<div>styled</div>`;
          }
        }
      );
      const el1 = document.createElement(base);
      const el2 = document.createElement(base);
      container.appendChild(el1);
      container.appendChild(el2);
      await Promise.all([
        (el1 as ReactiveElement).updateComplete,
        (el2 as ReactiveElement).updateComplete,
      ]);
      assert.equal(
        getComputedStyle(el1).getPropertyValue('border-top-width').trim(),
        '10px',
        'el1 styled correctly'
      );
      assert.equal(
        getComputedStyle(el2).getPropertyValue('border-top-width').trim(),
        '10px',
        'el2 styled correctly'
      );
      assert.equal(
        stylesCounter,
        1,
        'styles property should only be accessed once'
      );
      assert.equal(getStylesCounter, 1, 'getStyles() should be called once');
    });

    test('Styles are not removed if the first rendered value is undefined.', async () => {
      const localName = generateElementName();

      class SomeCustomElement extends RenderingElement {
        static override styles = css`
          :host {
            border: 4px solid black;
          }
        `;

        renderUndefined: boolean;

        constructor() {
          super();
          this.renderUndefined = true;
        }

        static override get properties() {
          return {
            renderUndefined: {
              type: Boolean,
              value: true,
            },
          };
        }

        override render() {
          if (this.renderUndefined) {
            return undefined;
          }

          return html`Some text.`;
        }
      }
      customElements.define(localName, SomeCustomElement);

      const element = document.createElement(localName) as SomeCustomElement;
      document.body.appendChild(element);

      await (element as ReactiveElement).updateComplete;
      assert.equal(
        getComputedStyle(element).getPropertyValue('border-top-width').trim(),
        '4px'
      );

      element.renderUndefined = false;

      await (element as ReactiveElement).updateComplete;
      assert.equal(
        getComputedStyle(element).getPropertyValue('border-top-width').trim(),
        '4px'
      );

      document.body.removeChild(element);
    });

    const testAdoptedStyleSheets =
      window.ShadowRoot && 'replace' in CSSStyleSheet.prototype;
    (testAdoptedStyleSheets ? test : test.skip)(
      'Can return CSSStyleSheet where adoptedStyleSheets are natively supported',
      async () => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync('div { border: 4px solid red; }');
        const normal = css`
          span {
            border: 4px solid blue;
          }
        `;

        const base = generateElementName();
        customElements.define(
          base,
          class extends RenderingElement {
            static override styles = [sheet, normal];

            override render() {
              return html`<div></div>
                <span></span>`;
            }
          }
        );

        const el = document.createElement(base);
        container.appendChild(el);
        await (el as ReactiveElement).updateComplete;
        const div = el.shadowRoot!.querySelector('div')!;
        assert.equal(
          getComputedStyle(div).getPropertyValue('border-top-width').trim(),
          '4px'
        );

        const span = el.shadowRoot!.querySelector('span')!;
        assert.equal(
          getComputedStyle(span).getPropertyValue('border-top-width').trim(),
          '4px'
        );

        // When the WC polyfills are included, calling .replaceSync is a noop to
        // our styles as they're already flattened (so expect 4px). Otherwise,
        // look for the updated value.
        const usesAdoptedStyleSheet =
          window.ShadyCSS === undefined || window.ShadyCSS.nativeShadow;
        const expectedValue = usesAdoptedStyleSheet ? '2px' : '4px';
        sheet.replaceSync('div { border: 2px solid red; }');

        assert.equal(
          getComputedStyle(div).getPropertyValue('border-top-width').trim(),
          expectedValue
        );
      }
    );

    // Test that when ShadyCSS is enabled (while still having native support for
    // adoptedStyleSheets), we can return a CSSStyleSheet that will be flattened
    // and play nice with others.
    const testShadyCSSWithAdoptedStyleSheetSupport =
      window.ShadowRoot &&
      'replace' in CSSStyleSheet.prototype &&
      window.ShadyCSS !== undefined &&
      !window.ShadyCSS.nativeShadow;
    (testShadyCSSWithAdoptedStyleSheetSupport ? test : test.skip)(
      'CSSStyleSheet is flattened where ShadyCSS is enabled yet adoptedStyleSheets are supported',
      async () => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync('div { border: 4px solid red; }');

        const base = generateElementName();
        customElements.define(
          base,
          class extends RenderingElement {
            static override styles = sheet;

            override render() {
              return html`<div></div>`;
            }
          }
        );

        const el = document.createElement(base);
        container.appendChild(el);
        await (el as ReactiveElement).updateComplete;

        const div = el.shadowRoot!.querySelector('div')!;
        assert.equal(
          getComputedStyle(div).getPropertyValue('border-top-width').trim(),
          '4px'
        );

        // CSSStyleSheet update should fail, as the styles will be flattened.
        sheet.replaceSync('div { border: 2px solid red; }');
        assert.equal(
          getComputedStyle(div).getPropertyValue('border-top-width').trim(),
          '4px',
          'CSS should not reflect CSSStyleSheet as it was flattened'
        );
      }
    );
  });

  suite('CSS Custom Properties', () => {
    let container: HTMLElement;

    setup(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    teardown(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    test('custom properties render', async () => {
      const name = generateElementName();

      const testStyle = (el: HTMLElement) => {
        const div = el.shadowRoot!.querySelector('div');
        assert.equal(
          getComputedStyleValue(div!, 'border-top-width').trim(),
          '8px'
        );
      };
      customElements.define(
        name,
        class extends RenderingElement {
          static override get styles() {
            return css`
              :host {
                --border: 8px solid red;
              }
              div {
                border: var(--border);
              }
            `;
          }

          override render() {
            return html`<div>Testing...</div>`;
          }

          override firstUpdated() {
            testStyle(this);
          }
        }
      );
      const el = document.createElement(name);
      container.appendChild(el);
      await (el as ReactiveElement).updateComplete;
      testStyle(el);
    });

    test('custom properties flow to nested elements', async () => {
      customElements.define(
        'x-inner',
        class extends RenderingElement {
          static override get styles() {
            return css`
              div {
                border: var(--border);
              }
            `;
          }

          override render() {
            return html`<div>Testing...</div>`;
          }
        }
      );
      const name = generateElementName();
      class E extends RenderingElement {
        inner: RenderingElement | null = null;

        static override get styles() {
          return css`
            x-inner {
              --border: 8px solid red;
            }
          `;
        }

        override render() {
          return html`<x-inner></x-inner>`;
        }

        override firstUpdated() {
          this.inner = this.shadowRoot!.querySelector(
            'x-inner'
          )! as RenderingElement;
        }
      }
      customElements.define(name, E);
      const el = document.createElement(name) as E;
      container.appendChild(el);

      // Workaround for Safari 9 Promise timing bugs.
      (await el.updateComplete) && (await el.inner!.updateComplete);

      await nextFrame();
      const div = el.inner!.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '8px'
      );
    });

    test('elements with custom properties can move between elements', async () => {
      customElements.define(
        'x-inner1',
        class extends RenderingElement {
          static override get styles() {
            return css`
              div {
                border: var(--border);
              }
            `;
          }

          override render() {
            return html`<div>Testing...</div>`;
          }
        }
      );
      const name1 = generateElementName();
      customElements.define(
        name1,
        class extends RenderingElement {
          inner: Element | null = null;

          static override get styles() {
            return css`
              x-inner1 {
                --border: 2px solid red;
              }
            `;
          }

          override render() {
            return html`<x-inner1></x-inner1>`;
          }

          override firstUpdated() {
            this.inner = this.shadowRoot!.querySelector('x-inner1');
          }
        }
      );
      const name2 = generateElementName();
      customElements.define(
        name2,
        class extends RenderingElement {
          static override get styles() {
            return css`
              x-inner1 {
                --border: 8px solid red;
              }
            `;
          }

          override render() {
            return html``;
          }
        }
      );
      const el = document.createElement(name1) as ReactiveElement;
      const el2 = document.createElement(name2);
      container.appendChild(el);
      container.appendChild(el2);

      // Workaround for Safari 9 Promise timing bugs.
      await el.updateComplete;

      await nextFrame();
      const inner = el.shadowRoot!.querySelector('x-inner1');
      const div = inner!.shadowRoot!.querySelector('div');
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '2px'
      );
      el2.shadowRoot!.appendChild(inner!);

      // Workaround for Safari 9 Promise timing bugs.
      await el.updateComplete;

      await nextFrame();
      assert.equal(
        getComputedStyleValue(div!, 'border-top-width').trim(),
        '8px'
      );
    });
  });
});
