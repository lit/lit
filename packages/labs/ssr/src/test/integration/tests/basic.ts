/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@lit-labs/ssr-client/lit-element-hydrate-support.js';

import {html, mathml, svg, noChange, nothing, Part} from 'lit';
import {html as staticHtml, literal} from 'lit/static-html.js';
import {
  directive,
  Directive,
  DirectiveParameters,
  DirectiveResult,
  PartInfo,
  PartType,
} from 'lit/directive.js';
import {repeat} from 'lit/directives/repeat.js';
import {map} from 'lit/directives/map.js';
import {guard} from 'lit/directives/guard.js';
import {cache} from 'lit/directives/cache.js';
import {classMap} from 'lit/directives/class-map.js';
import {styleMap} from 'lit/directives/style-map.js';
import {until} from 'lit/directives/until.js';
// TODO(kschaaf): Enable once async directives are implemented
// import {asyncAppend} from 'lit/directives/async-append.js';
// import {asyncReplace} from 'lit/directives/async-replace.js';
// import {TestAsyncIterable} from 'lit/test/lib/test-async-iterable.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {live} from 'lit/directives/live.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {unsafeMathML} from 'lit/directives/unsafe-mathml.js';
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import {createRef, ref} from 'lit/directives/ref.js';

import {LitElement, PropertyValues} from 'lit';
import {property} from 'lit/decorators/property.js';
import {
  renderLight,
  RenderLightHost,
} from '@lit-labs/ssr-client/directives/render-light.js';

import {anyHtml, SSRTest, SSRTestDescription} from './ssr-test.js';
import {AsyncDirective} from 'lit/async-directive.js';
import {html as serverhtml} from '../../../lib/server-template.js';

interface DivWithProp extends HTMLDivElement {
  prop?: unknown;
  prop2?: unknown;
}

interface ClickableButton extends HTMLButtonElement {
  __wasClicked: boolean;
  __wasClicked2: boolean;
}
interface ClickableInput extends HTMLInputElement {
  __wasClicked: boolean;
  __wasClicked2: boolean;
}

const throwIfRunOnServer = () => {
  if (!(globalThis instanceof window.constructor)) {
    throw new Error('Update should not be run on the server');
  }
};

const filterNodes = (nodes: ArrayLike<Node>, nodeType: number) =>
  Array.from(nodes).filter((n) => n.nodeType === nodeType);

export const tests: {[name: string]: SSRTest} = {
  // TODO: add suites (for now, delineating with comments)

  /******************************************************
   * ChildPart tests
   ******************************************************/

  'ChildPart accepts a string': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
      {
        args: ['foo2'],
        html: '<div>foo2</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts a number': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [123],
        html: '<div>123</div>',
      },
      {
        args: [456.789],
        html: '<div>456.789</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts undefined': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
      },
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts null': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [null],
        html: '<div></div>',
      },
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts noChange': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>',
      },
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts nothing': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>',
      },
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts array': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [[1, 2, 3]],
        html: '<div>123</div>',
      },
      {
        args: [[4, 5, 6]],
        html: '<div>456</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts set': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [new Set([1, 2, 3])],
        html: '<div>123</div>',
      },
      {
        args: [new Set([4, 5, 6])],
        html: '<div>456</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts an object': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [{}],
        html: '<div>[object Object]</div>',
      },
      {
        args: [{}],
        html: '<div>[object Object]</div>',
      },
    ],
    // Objects are not dirty-checked before being toString()'ed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'ChildPart accepts an object with a toString method': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        args: [
          {
            toString() {
              return 'toString!';
            },
          },
        ],
        html: '<div>toString!</div>',
      },
      {
        args: [
          {
            toString() {
              return 'toString2!';
            },
          },
        ],
        html: '<div>toString2!</div>',
      },
    ],
    // Objects are not dirty-checked before being toString()'ed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'ChildPart accepts a function': {
    render(x: unknown) {
      return html` <div>${x}</div> `;
    },
    expectations: [
      {
        // prettier-ignore
        args: [ () => { throw new Error(); }, ],
        html: '<div>() => { throw new Error(); }</div>',
      },
      {
        // prettier-ignore
        args: [ () => { throw new Error("2"); }, ],
        html: '<div>() => { throw new Error("2"); }</div>',
      },
    ],
    // Functions are not dirty-checked before being toString()'ed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'ChildPart accepts TemplateResult': {
    render(x: unknown) {
      return html` <div>${html` <span>${x}</span> `}</div> `;
    },
    expectations: [
      {
        args: ['A'],
        html: '<div><span>A</span></div>',
      },
      {
        args: ['B'],
        html: '<div><span>B</span></div>',
      },
    ],
    stableSelectors: ['div', 'span'],
  },

  // Regression test for https://github.com/lit/lit/issues/4265
  // Ensures we do not get extra svg tags around `svg` tagged templates.
  'ChildPart accepts TemplateResult with SVG type': {
    render(x: unknown) {
      return html` <svg>${svg`<circle r="${x}" />`}</svg> `;
    },
    expectations: [
      {
        args: [11],
        html: '<svg><circle r="11" /></svg>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // semantic dom diff ignores svg elements, which means we can only
          // test SVG imperatively.
          const svgElements = dom.querySelectorAll('svg');
          // Expect only a single svg element to have been rendered.
          assert.lengthOf(svgElements, 1);
        },
      },
    ],
    stableSelectors: ['svg', 'circle'],
  },

  'ChildPart accepts TemplateResult with MATHML type': {
    render(x: unknown) {
      return html` <math>${mathml`<mi>${x}</mi>`}</math> `;
    },
    expectations: [
      {
        args: ['a'],
        html: '<math><mi>a</mi></math>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const mathElements = dom.querySelectorAll('math');
          // Expect only a single math element to have been rendered.
          assert.lengthOf(mathElements, 1);
        },
      },
    ],
    stableSelectors: ['math', 'mi'],
  },

  'multiple ChildParts, adjacent primitive values': {
    render(x: unknown, y: unknown) {
      return html` <div>${x}${y}</div> `;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div>AB</div>',
      },
      {
        args: ['C', 'D'],
        html: '<div>CD</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'multiple ChildParts, adjacent primitive & TemplateResult': {
    render(x: unknown, y: unknown) {
      return html` <div>${x}${html` <span>${y}</span> `}</div> `;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div>A\n  <span>B</span></div>',
      },
      {
        args: ['C', 'D'],
        html: '<div>C\n  <span>D</span></div>',
      },
    ],
    stableSelectors: ['div', 'span'],
  },

  'multiple ChildParts, adjacent TemplateResults': {
    render(x: unknown, y: unknown) {
      return html`
        <div>${html` <span>${x}</span> `}${html` <span>${y}</span> `}</div>
      `;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div><span>A</span><span>B</span></div>',
      },
      {
        args: ['C', 'D'],
        html: '<div><span>C</span><span>D</span></div>',
      },
    ],
    stableSelectors: ['div', 'span'],
  },

  'multiple ChildParts with whitespace': {
    render(x: unknown, y: unknown) {
      return html` <div>${x} ${y}</div> `;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div>A B</div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const childNodes = dom.querySelector('div')!.childNodes;
          const textContent = filterNodes(childNodes, Node.TEXT_NODE).map(
            (n) => n.textContent
          );
          assert.deepEqual(textContent, ['A', ' ', 'B']);
        },
      },
      {
        args: ['C', 'D'],
        html: '<div>C D</div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const childNodes = dom.querySelector('div')!.childNodes;
          const textContent = filterNodes(childNodes, Node.TEXT_NODE).map(
            (n) => n.textContent
          );
          assert.deepEqual(textContent, ['C', ' ', 'D']);
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart with trailing whitespace': {
    render(x: unknown) {
      // prettier-ignore
      return html`<div>${x} </div>`;
    },
    expectations: [
      {
        args: ['A'],
        html: '<div>A\n  </div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const childNodes = dom.querySelector('div')!.childNodes;
          const textContent = filterNodes(childNodes, Node.TEXT_NODE).map(
            (n) => n.textContent
          );
          assert.deepEqual(textContent, ['A', ' ']);
        },
      },
      {
        args: ['B'],
        html: '<div>B\n  </div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const childNodes = dom.querySelector('div')!.childNodes;
          const textContent = filterNodes(childNodes, Node.TEXT_NODE).map(
            (n) => n.textContent
          );
          assert.deepEqual(textContent, ['B', ' ']);
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts array with strings': {
    render(words: string[]) {
      return html` <div>${words}</div> `;
    },
    expectations: [
      {
        args: [['A', 'B', 'C']],
        html: '<div>ABC</div>',
      },
      {
        args: [['D', 'E', 'F']],
        html: '<div>DEF</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts array with strings, updated with fewer items': {
    render(words: string[]) {
      return html` <div>${words}</div> `;
    },
    expectations: [
      {
        args: [['A', 'B', 'C']],
        html: '<div>ABC</div>',
      },
      // Attribute hydration not working yet
      {
        args: [['D', 'E']],
        html: '<div>DE</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts array with strings, updated with more items': {
    render(words: string[]) {
      return html` <div>${words}</div> `;
    },
    expectations: [
      {
        args: [['A', 'B', 'C']],
        html: '<div>ABC</div>',
      },
      // Attribute hydration not working yet
      {
        args: [['D', 'E', 'F', 'G']],
        html: '<div>DEFG</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts array with templates': {
    render(words: string[]) {
      return html`
        <ol>
          ${words.map((w) => html` <li>${w}</li> `)}
        </ol>
      `;
    },
    expectations: [
      {
        args: [['A', 'B', 'C']],
        html: '<ol><li>A</li>\n  <li>B</li>\n  <li>C</li></ol>',
      },
      {
        args: [['D', 'E', 'F']],
        html: '<ol><li>D</li>\n  <li>E</li>\n  <li>F</li></ol>',
      },
    ],
    stableSelectors: ['ol', 'li'],
  },

  'ChildPart accepts simple directive': () => {
    const basic = directive(
      class extends Directive {
        count = 0;
        lastValue: string | undefined = undefined;
        override update(_part: Part, [v]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          return this.render(v);
        }
        render(v: string) {
          if (v !== this.lastValue) {
            this.lastValue = v;
            this.count++;
          }
          return `[${this.count}:${v}]`;
        }
      }
    );
    return {
      render(v: string) {
        return html` <div>${basic(v)}</div> `;
      },
      expectations: [
        {
          args: ['one'],
          html: '<div>[1:one]</div>',
        },
        {
          args: ['two'],
          html: '<div>[2:two]</div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'ChildPart directive gets PartInfo': () => {
    const info = directive(
      class extends Directive {
        partInfo: PartInfo;
        constructor(partInfo: PartInfo) {
          super(partInfo);
          this.partInfo = partInfo;
        }
        render(v: string) {
          if (this.partInfo.type !== PartType.CHILD) {
            throw new Error('expected PartType.CHILD');
          }
          return `[${v}]`;
        }
      }
    );
    return {
      render(v: string) {
        return html` <div>${info(v)}</div> `;
      },
      expectations: [
        {
          args: ['one'],
          html: '<div>[one]</div>',
        },
        {
          args: ['two'],
          html: '<div>[two]</div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'ChildPart accepts nested directives': () => {
    const aDirective = directive(
      class extends Directive {
        override update(_part: Part, [bool, v]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          return this.render(bool, v);
        }
        render(bool: boolean, v: unknown) {
          return bool ? v : nothing;
        }
      }
    );
    const bDirective = directive(
      class extends Directive {
        count = 0;
        lastValue: string | undefined = undefined;
        override update(_part: Part, [v]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          return this.render(v);
        }
        render(v: string) {
          if (v !== this.lastValue) {
            this.lastValue = v;
            this.count++;
          }
          return `[B:${this.count}:${v}]`;
        }
      }
    );
    return {
      render(bool: boolean, v: string) {
        return html` <div>${aDirective(bool, bDirective(v))}</div> `;
      },
      expectations: [
        {
          args: [true, 'X'],
          html: '<div>[B:1:X]</div>',
        },
        {
          args: [true, 'Y'],
          html: '<div>[B:2:Y]</div>',
        },
        {
          args: [false, 'X'],
          html: '<div></div>',
        },
        {
          args: [true, 'X'],
          html: '<div>[B:1:X]</div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'ChildPart accepts directive: repeat (with strings)': {
    render(words: string[]) {
      return html` ${repeat(words, (word, i) => `(${i} ${word})`)} `;
    },
    expectations: [
      {
        args: [['foo', 'bar', 'qux']],
        html: '(0 foo)(1 bar)(2 qux)',
      },
      {
        args: [['A', 'B', 'C']],
        html: '(0 A)(1 B)(2 C)',
      },
    ],
    stableSelectors: [],
  },

  'ChildPart accepts directive: repeat (with templates)': {
    render(words: string[]) {
      return html`
        ${repeat(words, (word, i) => html` <p>${i}) ${word}</p> `)}
      `;
    },
    expectations: [
      {
        args: [['foo', 'bar', 'qux']],
        html: '<p>\n  0) foo\n</p>\n<p>\n  1) bar\n</p>\n<p>\n  2) qux\n</p>\n',
      },
      {
        args: [['A', 'B', 'C']],
        html: '<p>\n  0) A\n</p>\n<p>\n  1) B\n</p>\n<p>\n  2) C\n</p>\n',
      },
    ],
    stableSelectors: ['p'],
  },

  'ChildPart accepts directive: map': {
    render(words: string[]) {
      return html` ${map(words, (word, i) => html` <p>${i}) ${word}</p> `)} `;
    },
    expectations: [
      {
        args: [['foo', 'bar', 'qux']],
        html: '<p>\n  0) foo\n</p>\n<p>\n  1) bar\n</p>\n<p>\n  2) qux\n</p>\n',
      },
      {
        args: [['A', 'B', 'C']],
        html: '<p>\n  0) A\n</p>\n<p>\n  1) B\n</p>\n<p>\n  2) C\n</p>\n',
      },
    ],
    stableSelectors: ['p'],
  },

  'ChildPart accepts directive: cache': {
    render(bool: boolean) {
      return html`
        ${cache(bool ? html` <p>true</p> ` : html` <b>false</b> `)}
      `;
    },
    expectations: [
      {
        args: [true],
        html: '<p>true</p>',
      },
      {
        args: [false],
        html: '<b>false</b>',
      },
      {
        args: [true],
        html: '<p>true</p>',
      },
    ],
    stableSelectors: [],
  },

  'ChildPart accepts directive: guard': () => {
    let guardedCallCount = 0;
    const guardedTemplate = (bool: boolean) => {
      guardedCallCount++;
      return html` value is ${bool ? true : false} `;
    };
    return {
      render(bool: boolean) {
        return html` <div>${guard([bool], () => guardedTemplate(bool))}</div> `;
      },
      expectations: [
        {
          args: [true],
          html: '<div>value is true</div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          },
        },
        {
          args: [true],
          html: '<div>value is true</div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          },
        },
        {
          args: [false],
          html: '<div>value is false</div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 2);
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'ChildPart accepts directive: until (primitive)': {
    render(...args) {
      return html` <div>${until(...args)}</div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
      {
        args: ['bar'],
        html: '<div>bar</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts directive: until (promise, primitive)': () => {
    let resolve: (v: string) => void;
    const promise = new Promise((r) => (resolve = r));
    return {
      render(...args) {
        return html` <div>${until(...args)}</div> `;
      },
      expectations: [
        {
          args: [promise, 'foo'],
          html: '<div>foo</div>',
        },
        {
          async setup() {
            resolve('promise');
            await promise;
          },
          args: [promise, 'foo'],
          html: '<div>promise</div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'ChildPart accepts directive: until (promise, promise)': () => {
    let resolve1: (v: string) => void;
    let resolve2: (v: string) => void;
    const promise1 = new Promise((r) => (resolve1 = r));
    const promise2 = new Promise((r) => (resolve2 = r));
    return {
      render(...args) {
        return html` <div>${until(...args)}</div> `;
      },
      expectations: [
        {
          args: [promise2, promise1],
          html: '<div></div>',
        },
        {
          async setup() {
            resolve1('promise1');
            await promise1;
          },
          args: [promise2, promise1],
          html: '<div>promise1</div>',
        },
        {
          async setup() {
            resolve2('promise2');
            await promise2;
          },
          args: [promise2, promise1],
          html: '<div>promise2</div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  // TODO(kschaaf): Enable once async directives are implemented

  // 'ChildPart accepts directive: asyncAppend': () => {
  //   const iterable = new TestAsyncIterable();
  //   return {
  //     render(iterable) {
  //       return html`<div>${asyncAppend(iterable)}</div>`
  //     },
  //     expectations: [
  //       {
  //         args: [iterable],
  //         html: '<div></div>',
  //       },
  //       {
  //         async setup() {
  //           await iterable.push('a');
  //         },
  //         args: [iterable],
  //         html: '<div>a</div>',
  //       },
  //       {
  //         async setup() {
  //           await iterable.push('b');
  //         },
  //         args: [iterable],
  //         html: '<div>\n  ab\n</div>',
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //   };
  // },

  // 'ChildPart accepts directive: asyncReplace': () => {
  //   const iterable = new TestAsyncIterable();
  //   return {
  //     render(iterable) {
  //       return html`<div>${asyncReplace(iterable)}</div>`
  //     },
  //     expectations: [
  //       {
  //         args: [iterable],
  //         html: '<div></div>',
  //       },
  //       {
  //         async setup() {
  //           await iterable.push('a');
  //         },
  //         args: [iterable],
  //         html: '<div>a</div>',
  //       },
  //       {
  //         async setup() {
  //           await iterable.push('b');
  //         },
  //         args: [iterable],
  //         html: '<div>b</div>',
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //   };
  // },

  'ChildPart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html` <div>${ifDefined(v)}</div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
      },
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts directive: ifDefined (defined)': {
    render(v) {
      return html` <div>${ifDefined(v)}</div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
      {
        args: [undefined],
        html: '<div></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts directive: unsafeHTML': {
    render(v) {
      return html` <div>${unsafeHTML(v)}</div> `;
    },
    expectations: [
      {
        args: ['<span foo="bar"></span>'],
        html: '<div><span foo="bar"></span></div>',
      },
      {
        args: ['<p bar="foo"></p>'],
        html: '<div><p bar="foo"></p></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart accepts directive: unsafeSVG': {
    render(v) {
      return html` <svg>${unsafeSVG(v)}</svg> `;
    },
    expectations: [
      {
        args: ['<circle cx="50" cy="50" r="40" />'],
        html: '<svg><circle cx="50" cy="50" r="40"></circle></svg>',
      },
      {
        args: ['<ellipse cx="100" cy="50" rx="100" ry="50" />'],
        html: '<svg><ellipse cx="100" cy="50" rx="100" ry="50"></ellipse></svg>',
      },
    ],
    stableSelectors: ['svg'],
  },

  'ChildPart accepts directive: unsafeMath': {
    render(v) {
      return html` <math>${unsafeMathML(v)}</math> `;
    },
    expectations: [
      {
        args: ['<mi>a</mi>'],
        html: '<math><mi>a</mi></math>',
      },
      {
        args: ['<mn>1</mn>'],
        html: '<math><mn>1</mn></math>',
      },
    ],
    stableSelectors: ['math'],
  },

  /******************************************************
   * AttributePart tests
   ******************************************************/

  'AttributePart after a text node': {
    render(x: unknown) {
      return html`
        ABC
        <div class=${x}></div>
      `;
    },
    expectations: [
      {
        args: ['TEST'],
        html: 'ABC<div class="TEST"></div>',
      },
      {
        args: ['TEST2'],
        html: 'ABC<div class="TEST2"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts a string': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>',
      },
      {
        args: ['TEST2'],
        html: '<div class="TEST2"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts a number': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: [123],
        html: '<div class="123"></div>',
      },
      {
        args: [456.789],
        html: '<div class="456.789"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts undefined': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div class=""></div>',
      },
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts null': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: [null],
        html: '<div class=""></div>',
      },
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts noChange': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>',
      },
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts nothing': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>',
      },
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts an array': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: [['a', 'b', 'c']],
        html: '<div class="a,b,c"></div>',
      },
      {
        args: [['d', 'e', 'f']],
        html: '<div class="d,e,f"></div>',
      },
    ],
    stableSelectors: ['div'],
    // Setting an object/array always results in setAttribute being called
    expectMutationsOnFirstRender: true,
  },

  'AttributePart accepts an object': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: [{foo: 'bar'}],
        html: '<div class="[object Object]"></div>',
      },
      {
        args: [{ziz: 'zaz'}],
        html: '<div class="[object Object]"></div>',
      },
    ],
    stableSelectors: ['div'],
    // Setting an object/array always results in setAttribute being called
    expectMutationsOnFirstRender: true,
  },

  'AttributePart accepts an object with a toString method': {
    render(x: unknown) {
      return html` <div class=${x}></div> `;
    },
    expectations: [
      {
        args: [
          {
            toString() {
              return 'toString!';
            },
          },
        ],
        html: '<div class="toString!"></div>',
      },
      {
        args: [
          {
            toString() {
              return 'toString2!';
            },
          },
        ],
        html: '<div class="toString2!"></div>',
      },
    ],
    stableSelectors: ['div'],
    // Setting an object/array always results in setAttribute being called
    expectMutationsOnFirstRender: true,
  },

  'AttributePart accepts simple directive': () => {
    const basic = directive(
      class extends Directive {
        count = 0;
        lastValue: string | undefined = undefined;
        override update(_part: Part, [v]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          return this.render(v);
        }
        render(v: string) {
          if (v !== this.lastValue) {
            this.lastValue = v;
            this.count++;
          }
          return `[${this.count}:${v}]`;
        }
      }
    );
    return {
      render(v: string) {
        return html` <div a="${basic(v)}"></div> `;
      },
      expectations: [
        {
          args: ['one'],
          html: '<div a="[1:one]"></div>',
        },
        {
          args: ['two'],
          html: '<div a="[2:two]"></div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'AttributePart directive gets PartInfo': () => {
    const info = directive(
      class extends Directive {
        partInfo: PartInfo;
        constructor(partInfo: PartInfo) {
          super(partInfo);
          this.partInfo = partInfo;
        }
        render(v: string) {
          if (this.partInfo.type !== PartType.ATTRIBUTE) {
            throw new Error('expected PartType.ATTRIBUTE');
          }
          const {tagName, name, strings} = this.partInfo;
          return `[${v}:${tagName}:${name}:${strings!.join(':')}]`;
        }
      }
    );
    return {
      render(v: string) {
        return html` <div title="a${info(v)}b"></div> `;
      },
      expectations: [
        {
          args: ['one'],
          html: '<div title="a[one:DIV:title:a:b]b"></div>',
        },
        {
          args: ['two'],
          html: '<div title="a[two:DIV:title:a:b]b"></div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'AttributePart accepts nested directives': () => {
    const aDirective = directive(
      class extends Directive {
        override update(_part: Part, [bool, v]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          return this.render(bool, v);
        }
        render(bool: boolean, v: unknown) {
          return bool ? v : nothing;
        }
      }
    );
    const bDirective = directive(
      class extends Directive {
        count = 0;
        lastValue: string | undefined = undefined;
        override update(_part: Part, [v]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          return this.render(v);
        }
        render(v: string) {
          if (v !== this.lastValue) {
            this.lastValue = v;
            this.count++;
          }
          return `[B:${this.count}:${v}]`;
        }
      }
    );
    return {
      render(bool: boolean, v: string) {
        return html` <div a="${aDirective(bool, bDirective(v))}"></div> `;
      },
      expectations: [
        {
          args: [true, 'X'],
          html: '<div a="[B:1:X]"></div>',
        },
        {
          args: [true, 'Y'],
          html: '<div a="[B:2:Y]"></div>',
        },
        {
          args: [false, 'X'],
          html: '<div></div>',
        },
        {
          args: [true, 'X'],
          html: '<div a="[B:1:X]"></div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'AttributePart accepts directive: classMap': {
    render(map: {}) {
      return html` <div class=${classMap(map)}></div> `;
    },
    expectations: [
      {
        args: [{foo: true, bar: false, baz: true}],
        html: '<div class="foo baz"></div>',
      },
      {
        args: [{foo: false, bar: true, baz: true, zug: true}],
        html: '<div class="bar baz zug"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: classMap (with statics)': {
    render(map: {}) {
      return html` <div class="static1 ${classMap(map)} static2"></div> `;
    },
    expectations: [
      {
        args: [{foo: true, bar: false, baz: true}],
        html: '<div class="static1 foo baz static2"></div>',
      },
      {
        args: [{foo: false, bar: true, baz: true, zug: true}],
        html: '<div class="static1 bar baz zug static2"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: styleMap': {
    render(map: {}) {
      return html` <div style=${styleMap(map)}></div> `;
    },
    expectations: [
      {
        // Note that (at least on chrome, vendor-prefixed properties get
        // collapsed down to the standard property name when re-parsed on the
        // browser)
        args: [
          {
            height: '5px',
            paddingTop: '10px',
          },
        ],
        html: '<div style="height: 5px; padding-top: 10px;"></div>',
      },
      {
        args: [
          {
            paddingTop: '20px',
            backgroundColor: 'white',
          },
        ],
        html: '<div style="padding-top: 20px; background-color: white;"></div>',
      },
    ],
    // styleMap does not dirty check individual properties before setting,
    // which causes an attribute mutation even if the text has not changed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: styleMap (custom properties & browser-prefixed)':
    {
      // The parsed results of style text with custom properties and browser
      // prefixes differs across browsers (due to whitespace and re-writing
      // prefixed names) enough to make a single cross-platform assertion
      // difficult. For now, just test these on Chrome.
      skip: Boolean(
        globalThis.navigator && !navigator.userAgent.match(/Chrome/)
      ),
      render(map: {}) {
        return html` <div style=${styleMap(map)}></div> `;
      },
      expectations: [
        {
          // Note that (at least on chrome, vendor-prefixed properties get
          // collapsed down to the standard property name when re-parsed on the
          // browser)
          args: [
            {
              '--my-prop': 'green',
              webkitAppearance: 'none',
            },
          ],
          html: anyHtml([
            '<div style="--my-prop: green; appearance: none;"></div>',
            '<div style="--my-prop:green; appearance: none;"></div>',
          ]),
        },
        {
          args: [
            {
              '--my-prop': 'gray',
              webkitAppearance: 'inherit',
            },
          ],
          html: anyHtml([
            '<div style="--my-prop: gray; appearance: inherit;"></div>',
            '<div style="--my-prop:gray; appearance: inherit;"></div>',
          ]),
        },
      ],
      // styleMap does not dirty check individual properties before setting,
      // which causes an attribute mutation even if the text has not changed
      expectMutationsOnFirstRender: true,
      stableSelectors: ['div'],
    },

  'AttributePart accepts directive: styleMap (with statics)': {
    render(map: {}) {
      return html`
        <div style="color: red; ${styleMap(map)} height: 3px;"></div>
      `;
    },
    expectations: [
      {
        args: [{width: '5px'}],
        html: '<div style="color: red; width: 5px; height: 3px;"></div>',
      },
      {
        args: [{paddingTop: '20px'}],
        html: '<div style="color: red; height: 3px; padding-top: 20px;"></div>',
      },
    ],
    // styleMap does not dirty check individual properties before setting,
    // which causes an attribute mutation even if the text has not changed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: guard': () => {
    let guardedCallCount = 0;
    const guardedValue = (bool: boolean) => {
      guardedCallCount++;
      return bool ? 'true' : 'false';
    };
    return {
      render(bool: boolean) {
        return html`
          <div attr="${guard([bool], () => guardedValue(bool))}"></div>
        `;
      },
      expectations: [
        {
          args: [true],
          html: '<div attr="true"></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          },
        },
        {
          args: [true],
          html: '<div attr="true"></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          },
        },
        {
          args: [false],
          html: '<div attr="false"></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 2);
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'AttributePart accepts directive: until (primitive)': {
    render(...args) {
      return html` <div attr="${until(...args)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div attr="foo"></div>',
      },
      {
        args: ['bar'],
        html: '<div attr="bar"></div>',
      },
    ],
    stableSelectors: ['div'],
    // until always calls setValue each render, with no dirty-check of previous
    // value
    expectMutationsOnFirstRender: true,
  },

  'AttributePart accepts directive: until (promise, primitive)': () => {
    let resolve: (v: string) => void;
    const promise = new Promise((r) => (resolve = r));
    return {
      render(...args) {
        return html` <div attr="${until(...args)}"></div> `;
      },
      expectations: [
        {
          args: [promise, 'foo'],
          html: '<div attr="foo"></div>',
        },
        {
          async setup() {
            resolve('promise');
            await promise;
          },
          args: [promise, 'foo'],
          html: '<div attr="promise"></div>',
        },
      ],
      stableSelectors: ['div'],
      // until always calls setValue each render, with no dirty-check of previous
      // value
      expectMutationsOnFirstRender: true,
    };
  },

  'AttributePart accepts directive: until (promise, promise)': () => {
    let resolve1: (v: string) => void;
    let resolve2: (v: string) => void;
    const promise1 = new Promise((r) => (resolve1 = r));
    const promise2 = new Promise((r) => (resolve2 = r));
    return {
      render(...args) {
        return html` <div attr="${until(...args)}"></div> `;
      },
      expectations: [
        {
          args: [promise2, promise1],
          html: '<div></div>',
        },
        {
          async setup() {
            resolve1('promise1');
            await promise1;
          },
          args: [promise2, promise1],
          html: '<div attr="promise1"></div>',
        },
        {
          async setup() {
            resolve2('promise2');
            await promise2;
          },
          args: [promise2, promise1],
          html: '<div attr="promise2"></div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'AttributePart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html` <div attr="${ifDefined(v)}"></div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
      },
      {
        args: ['foo'],
        html: '<div attr="foo"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: ifDefined (defined)': {
    render(v) {
      return html` <div attr="${ifDefined(v)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div attr="foo"></div>',
      },
      {
        args: [undefined],
        html: '<div></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: live': {
    render(v: string) {
      return html` <div attr="${live(v)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div attr="foo"></div>',
      },
      {
        args: ['bar'],
        html: '<div attr="bar"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'multiple AttributeParts on same node': {
    render(x: unknown, y: unknown) {
      return html` <div class=${x} foo=${y}></div> `;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div class="A" foo="B"></div>',
      },
      {
        args: ['C', 'D'],
        html: '<div class="C" foo="D"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'multiple AttributeParts in same attribute': {
    render(x: unknown, y: unknown) {
      return html` <div class="${x} ${y}"></div> `;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div class="A B"></div>',
      },
      {
        args: ['C', 'D'],
        html: '<div class="C D"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'multiple AttributeParts across multiple attributes': {
    render(
      a: unknown,
      b: unknown,
      c: unknown,
      d: unknown,
      e: unknown,
      f: unknown
    ) {
      return html`
        <div ab="${a} ${b}" x c="${c}" y de="${d} ${e}" f="${f}" z></div>
      `;
    },
    expectations: [
      {
        args: ['a', 'b', 'c', 'd', 'e', 'f'],
        html: '<div ab="a b" x c="c" y de="d e" f="f" z></div>',
      },
      {
        args: ['A', 'B', 'C', 'D', 'E', 'F'],
        html: '<div ab="A B" x c="C" y de="D E" f="F" z></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'AttributePart on void element': {
    render(x: string) {
      return html`<input class=${x} />`;
    },
    expectations: [
      {
        args: ['TEST'],
        html: '<input class="TEST">',
      },
      {
        args: ['TEST2'],
        html: '<input class="TEST2">',
      },
    ],
    stableSelectors: ['input'],
  },

  'AttributePart on void element in shadow root': {
    // Regression test for https://github.com/lit/lit/issues/2946.
    //
    // Confirms that we do not crash when hydrating a shadow root containing an
    // immediate child that is a void element with an attribute binding. This is
    // an edge case because when the HTML parser encounters a void element, any
    // children it has, including our <!--lit-node 0--> comments, become
    // siblings instead of children.
    registerElements() {
      class VoidElementHost extends LitElement {
        @property()
        maxLen = 64;

        override render() {
          return html`<input max=${this.maxLen} />`;
        }
      }
      customElements.define('void-element-host', VoidElementHost);
    },
    render() {
      return html`<void-element-host></void-element-host>`;
    },
    expectations: [
      {
        args: [],
        html: '<void-element-host></void-element-host>',
        async check(assert: Chai.Assert, dom: HTMLElement) {
          const host = dom.querySelector('void-element-host') as LitElement & {
            maxLen: number;
          };
          assert.instanceOf(host, LitElement);
          assert.equal(host.maxLen, 64);

          await host.updateComplete;
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          const input = host.shadowRoot?.querySelector('input')!;
          assert.instanceOf(input, HTMLElement);
          assert.equal(input.getAttribute('max'), '64');

          host.maxLen++;
          await host.updateComplete;
          assert.equal(input.getAttribute('max'), '65');
        },
      },
    ],
    stableSelectors: ['input'],
  },

  'AttributePart on raw text element in shadow root': {
    // Regression test for https://github.com/lit/lit/issues/3663.
    //
    // Confirms that attribute bindings to raw text elements now
    // work as expected.
    registerElements() {
      class RawElementHost extends LitElement {
        @property()
        text = 'hello';

        override render() {
          return html`<textarea .value=${this.text}></textarea>`;
        }
      }
      customElements.define('raw-element-host', RawElementHost);
    },
    render() {
      return html`<raw-element-host></raw-element-host>`;
    },
    expectations: [
      {
        args: [],
        html: '<raw-element-host></raw-element-host>',
        async check(assert: Chai.Assert, dom: HTMLElement) {
          const host = dom.querySelector('raw-element-host') as LitElement & {
            text: string;
          };
          assert.instanceOf(host, LitElement);
          assert.equal(host.text, 'hello');

          await host.updateComplete;
          const textarea = host.shadowRoot?.querySelector('textarea');
          assert.equal(textarea?.value, 'hello');

          host.text = 'goodbye';
          await host.updateComplete;
          assert.equal(textarea?.value, 'goodbye');
        },
      },
    ],
    stableSelectors: ['textarea'],
  },

  /******************************************************
   * PropertyPart tests
   ******************************************************/

  'PropertyPart accepts a string': {
    render(x: unknown) {
      return html` <div .prop=${x}></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            'foo'
          );
        },
      },
      {
        args: ['foo2'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            'foo2'
          );
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts a string (reflected + camelCase)': {
    render(x: unknown) {
      return html` <div .className=${x}></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        },
      },
      {
        args: ['foo2'],
        html: '<div class="foo2"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(dom.querySelector('div')!.className, 'foo2');
        },
      },
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts a number': {
    render(x: unknown) {
      return html` <div .prop=${x}></div> `;
    },
    expectations: [
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as DivWithProp).prop, 1);
        },
      },
      {
        args: [2],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as DivWithProp).prop, 2);
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts a number (reflected)': {
    render(x: unknown) {
      return html` <div .className=${x}></div> `;
    },
    expectations: [
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        },
      },
      {
        args: [2],
        html: '<div class="2"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '2');
        },
      },
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts a boolean': {
    render(x: unknown) {
      return html` <div .prop=${x}></div> `;
    },
    expectations: [
      {
        args: [false],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            false
          );
        },
      },
      {
        args: [true],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            true
          );
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts a boolean (reflected)': {
    render(x: unknown) {
      return html` <div .className=${x}></div> `;
    },
    expectations: [
      {
        args: [false],
        html: '<div class="false"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'false');
        },
      },
      {
        args: [true],
        html: '<div class="true"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'true');
        },
      },
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts undefined': {
    render(x: unknown) {
      return html` <div .prop=${x}></div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            undefined
          );
        },
      },
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as DivWithProp).prop, 1);
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts undefined (reflected)': {
    render(x: unknown) {
      return html` <div .className=${x}></div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div class="undefined"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'undefined');
        },
      },
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        },
      },
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts null': {
    render(x: unknown) {
      return html` <div .prop=${x}></div> `;
    },
    expectations: [
      {
        args: [null],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            null
          );
        },
      },
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as DivWithProp).prop, 1);
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts null (reflected)': {
    render(x: unknown) {
      return html` <div .className=${x}></div> `;
    },
    expectations: [
      {
        args: [null],
        html: '<div class="null"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'null');
        },
      },
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        },
      },
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts noChange': {
    render(x: unknown) {
      return html` <div .prop=${x}></div> `;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Ideally this would be `notProperty`, but this is actually how
          // the client-side works right now, because the committer starts off
          // as dirty
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            undefined
          );
        },
      },
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as DivWithProp).prop, 1);
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts noChange (reflected)': {
    render(x: unknown) {
      return html` <div .className=${x}></div> `;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // className will always read as '' when unset
          assert.strictEqual(dom.querySelector('div')!.className, '');
        },
      },
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts nothing': {
    render(x: unknown) {
      return html` <div .prop=${x}></div> `;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            undefined
          );
        },
      },
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as DivWithProp).prop, 1);
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts nothing (reflected)': {
    // TODO: the current client-side does nothing special with `nothing`, just
    // passes it on to the property; is that what we want?
    render(x: unknown) {
      return html` <div .className=${x}></div> `;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // className will always read as '' when unset
          assert.strictEqual(dom.querySelector('div')!.className, '');
        },
      },
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        },
      },
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
    // Objects don't dirty check, so we get another mutation during first render
    expectMutationsOnFirstRender: true,
  },

  'PropertyPart accepts a symbol': () => {
    const testSymbol = Symbol();
    return {
      render(x: unknown) {
        return html` <div .prop=${x}></div> `;
      },
      expectations: [
        {
          args: [testSymbol],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              testSymbol
            );
          },
        },
        {
          args: [1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              1
            );
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts an object': () => {
    const testObject = {};
    return {
      render(x: unknown) {
        return html` <div .prop=${x}></div> `;
      },
      expectations: [
        {
          args: [testObject],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              testObject
            );
          },
        },
        {
          args: [1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              1
            );
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts an object (reflected)': () => {
    const testObject = {};
    return {
      render(x: unknown) {
        return html` <div .className=${x}></div> `;
      },
      expectations: [
        {
          args: [testObject],
          html: '<div class="[object Object]"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(
              dom.querySelector('div')!.className,
              '[object Object]'
            );
          },
        },
        {
          args: [1],
          html: '<div class="1"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '1');
          },
        },
      ],
      stableSelectors: ['div'],
      // We set properties during hydration, and natively-reflecting properties
      // will trigger a "mutation" even when set to the same value that was
      // rendered to its attribute
      expectMutationsDuringHydration: true,
      // Objects don't dirty check, so we get another mutation during first render
      expectMutationsOnFirstRender: true,
    };
  },

  'PropertyPart accepts an array': () => {
    const testArray = [1, 2, 3];
    return {
      render(x: unknown) {
        return html` <div .prop=${x}></div> `;
      },
      expectations: [
        {
          args: [testArray],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              testArray
            );
          },
        },
        {
          args: [1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              1
            );
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts an array (reflected)': () => {
    const testArray = [1, 2, 3];
    return {
      render(x: unknown) {
        return html` <div .className=${x}></div> `;
      },
      expectations: [
        {
          args: [testArray],
          html: '<div class="1,2,3"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '1,2,3');
          },
        },
        {
          args: [1],
          html: '<div class="1"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '1');
          },
        },
      ],
      stableSelectors: ['div'],
      // We set properties during hydration, and natively-reflecting properties
      // will trigger a "mutation" even when set to the same value that was
      // rendered to its attribute
      expectMutationsDuringHydration: true,
      // Arrays don't dirty check, so we get another mutation during first render
      expectMutationsOnFirstRender: true,
    };
  },

  'PropertyPart accepts a function': () => {
    const testFunction = () => 'test function';
    return {
      render(x: unknown) {
        return html` <div .prop=${x}></div> `;
      },
      expectations: [
        {
          args: [testFunction],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              testFunction
            );
          },
        },
        {
          args: [1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              1
            );
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts a function (reflected)': () => {
    const testFunction = () => 'test function';
    return {
      render(x: unknown) {
        return html` <div .className=${x}></div> `;
      },
      expectations: [
        {
          args: [testFunction],
          html: `<div class="() => 'test function'"></div>`,
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(
              dom.querySelector('div')!.className,
              `() => 'test function'`
            );
          },
        },
        {
          args: [1],
          html: '<div class="1"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '1');
          },
        },
      ],
      stableSelectors: ['div'],
      // We set properties during hydration, and natively-reflecting properties
      // will trigger a "mutation" even when set to the same value that was
      // rendered to its attribute
      expectMutationsDuringHydration: true,
      // Arrays don't dirty check, so we get another mutation during first render
      expectMutationsOnFirstRender: true,
    };
  },

  'PropertyPart directive gets PartInfo': () => {
    const info = directive(
      class extends Directive {
        partInfo: PartInfo;
        constructor(partInfo: PartInfo) {
          super(partInfo);
          this.partInfo = partInfo;
        }
        render(v: string) {
          if (this.partInfo.type !== PartType.PROPERTY) {
            throw new Error('expected PartType.PROPERTY');
          }
          const {tagName, name, strings} = this.partInfo;
          return `[${v}:${tagName}:${name}:${strings!.join(':')}]`;
        }
      }
    );
    return {
      render(v: string) {
        return html` <div .title="a${info(v)}b"></div> `;
      },
      expectations: [
        {
          args: ['one'],
          html: '<div title="a[one:DIV:title:a:b]b"></div>',
        },
        {
          args: ['two'],
          html: '<div title="a[two:DIV:title:a:b]b"></div>',
        },
      ],
      stableSelectors: ['div'],
      // We set properties during hydration, and natively-reflecting properties
      // will trigger a "mutation" even when set to the same value that was
      // rendered to its attribute
      expectMutationsDuringHydration: true,
    };
  },

  'PropertyPart accepts directive: guard': () => {
    let guardedCallCount = 0;
    const guardedValue = (bool: boolean) => {
      guardedCallCount++;
      return bool;
    };
    return {
      render(bool: boolean) {
        return html`
          <div .prop="${guard([bool], () => guardedValue(bool))}"></div>
        `;
      },
      expectations: [
        {
          args: [true],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              true
            );
          },
        },
        {
          args: [true],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              true
            );
          },
        },
        {
          args: [false],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 2);
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              false
            );
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts directive: guard (reflected)': () => {
    let guardedCallCount = 0;
    const guardedValue = (v: string) => {
      guardedCallCount++;
      return v;
    };
    return {
      render(v: string) {
        return html`
          <div .className="${guard([v], () => guardedValue(v))}"></div>
        `;
      },
      expectations: [
        {
          args: ['foo'],
          html: '<div class="foo"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, 'foo');
          },
        },
        {
          args: ['foo'],
          html: '<div class="foo"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, 'foo');
          },
        },
        {
          args: ['bar'],
          html: '<div class="bar"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 2);
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, 'bar');
          },
        },
      ],
      stableSelectors: ['div'],
      // We set properties during hydration, and natively-reflecting properties
      // will trigger a "mutation" even when set to the same value that was
      // rendered to its attribute
      expectMutationsDuringHydration: true,
    };
  },

  'PropertyPart accepts directive: until (primitive)': {
    render(...args) {
      return html` <div .prop="${until(...args)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            'foo'
          );
        },
      },
      {
        args: ['bar'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            'bar'
          );
        },
      },
    ],
    stableSelectors: ['div'],
    // until always calls setValue each render, with no dirty-check of previous
    // value
    expectMutationsOnFirstRender: true,
  },

  'PropertyPart accepts directive: until (primitive) (reflected)': {
    render(...args) {
      return html` <div .className="${until(...args)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        },
      },
      {
        args: ['bar'],
        html: '<div class="bar"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'bar');
        },
      },
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
    // until always calls setValue each render, with no dirty-check of previous
    // value
    expectMutationsOnFirstRender: true,
  },

  'PropertyPart accepts directive: until (promise, primitive)': () => {
    let resolve: (v: string) => void;
    const promise = new Promise((r) => (resolve = r));
    return {
      render(...args) {
        return html` <div .prop="${until(...args)}"></div> `;
      },
      expectations: [
        {
          args: [promise, 'foo'],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              'foo'
            );
          },
        },
        {
          async setup() {
            resolve('promise');
            await promise;
          },
          args: [promise, 'foo'],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              'promise'
            );
          },
        },
      ],
      stableSelectors: ['div'],
      // until always calls setValue each render, with no dirty-check of previous
      // value
      expectMutationsOnFirstRender: true,
    };
  },

  'PropertyPart accepts directive: until (promise, primitive) (reflected)':
    () => {
      let resolve: (v: string) => void;
      const promise = new Promise((r) => (resolve = r));
      return {
        render(...args) {
          return html` <div .className="${until(...args)}"></div> `;
        },
        expectations: [
          {
            args: [promise, 'foo'],
            html: '<div class="foo"></div>',
            check(assert: Chai.Assert, dom: HTMLElement) {
              // Note className coerces to string
              assert.strictEqual(dom.querySelector('div')!.className, 'foo');
            },
          },
          {
            async setup() {
              resolve('promise');
              await promise;
            },
            args: [promise, 'foo'],
            html: '<div class="promise"></div>',
            check(assert: Chai.Assert, dom: HTMLElement) {
              // Note className coerces to string
              assert.strictEqual(
                dom.querySelector('div')!.className,
                'promise'
              );
            },
          },
        ],
        stableSelectors: ['div'],
        // We set properties during hydration, and natively-reflecting properties
        // will trigger a "mutation" even when set to the same value that was
        // rendered to its attribute
        expectMutationsDuringHydration: true,
        // until always calls setValue each render, with no dirty-check of previous
        // value
        expectMutationsOnFirstRender: true,
      };
    },

  'PropertyPart accepts directive: until (promise, promise)': () => {
    let resolve1: (v: string) => void;
    let resolve2: (v: string) => void;
    const promise1 = new Promise((r) => (resolve1 = r));
    const promise2 = new Promise((r) => (resolve2 = r));
    return {
      render(...args) {
        return html` <div .prop="${until(...args)}"></div> `;
      },
      expectations: [
        {
          args: [promise2, promise1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.notProperty(dom.querySelector('div') as DivWithProp, 'prop');
          },
        },
        {
          async setup() {
            resolve1('promise1');
            await promise1;
          },
          args: [promise2, promise1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              'promise1'
            );
          },
        },
        {
          async setup() {
            resolve2('promise2');
            await promise2;
          },
          args: [promise2, promise1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual(
              (dom.querySelector('div') as DivWithProp).prop,
              'promise2'
            );
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts directive: until (promise, promise) (reflected)':
    () => {
      let resolve1: (v: string) => void;
      let resolve2: (v: string) => void;
      const promise1 = new Promise((r) => (resolve1 = r));
      const promise2 = new Promise((r) => (resolve2 = r));
      return {
        render(...args) {
          return html` <div .className="${until(...args)}"></div> `;
        },
        expectations: [
          {
            args: [promise2, promise1],
            html: '<div></div>',
            check(assert: Chai.Assert, dom: HTMLElement) {
              // Note className coerces to string
              assert.strictEqual(dom.querySelector('div')!.className, '');
            },
          },
          {
            async setup() {
              resolve1('promise1');
              await promise1;
            },
            args: [promise2, promise1],
            html: '<div class="promise1"></div>',
            check(assert: Chai.Assert, dom: HTMLElement) {
              // Note className coerces to string
              assert.strictEqual(
                dom.querySelector('div')!.className,
                'promise1'
              );
            },
          },
          {
            async setup() {
              resolve2('promise2');
              await promise2;
            },
            args: [promise2, promise1],
            html: '<div class="promise2"></div>',
            check(assert: Chai.Assert, dom: HTMLElement) {
              // Note className coerces to string
              assert.strictEqual(
                dom.querySelector('div')!.className,
                'promise2'
              );
            },
          },
        ],
        stableSelectors: ['div'],
      };
    },

  'PropertyPart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html` <div .prop="${ifDefined(v)}"></div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.notProperty(dom.querySelector('div') as DivWithProp, 'prop');
        },
      },
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            'foo'
          );
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts directive: ifDefined (undefined) (reflected)': {
    render(v) {
      return html` <div .className="${ifDefined(v)}"></div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '');
        },
      },
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts directive: ifDefined (defined)': {
    render(v) {
      return html` <div .prop="${ifDefined(v)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            'foo'
          );
        },
      },
      {
        args: [undefined],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            undefined
          );
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts directive: ifDefined (defined) (reflected)': {
    render(v) {
      return html` <div .className="${ifDefined(v)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        },
      },
      {
        args: [undefined],
        // `ifDefined` is supposed to be a no-op for non-attribute parts, which
        // means it sets `undefined` through, which sets it to the className
        // property which is coerced to 'undefined' and reflected
        html: '<div class="undefined"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'undefined');
        },
      },
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts directive: live': {
    render(v: string) {
      return html` <div .prop="${live(v)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            'foo'
          );
        },
      },
      {
        args: ['bar'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            'bar'
          );
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts directive: live (reflected)': {
    render(v: string) {
      return html` <div .className="${live(v)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        },
      },
      {
        args: ['bar'],
        html: '<div class="bar"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'bar');
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'multiple PropertyParts on same node': {
    render(x: unknown, y: unknown) {
      return html` <div .prop=${x} .prop2=${y}></div> `;
    },
    expectations: [
      {
        args: [1, true],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as DivWithProp).prop, 1);
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop2,
            true
          );
        },
      },
      {
        args: [2, false],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as DivWithProp).prop, 2);
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop2,
            false
          );
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'multiple PropertyParts in one property': {
    render(x: unknown, y: unknown) {
      return html` <div .prop="${x},${y}"></div> `;
    },
    expectations: [
      {
        args: [1, true],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            '1,true'
          );
        },
      },
      {
        args: [2, false],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(
            (dom.querySelector('div') as DivWithProp).prop,
            '2,false'
          );
        },
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart on void element': {
    render(x: string) {
      return html`<input .title=${x} />`;
    },
    expectations: [
      {
        args: ['TEST'],
        html: '<input title="TEST">',
      },
      {
        args: ['TEST2'],
        html: '<input title="TEST2">',
      },
    ],
    stableSelectors: ['input'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  /******************************************************
   * EventPart tests
   ******************************************************/

  EventPart: {
    render(listener: (e: Event) => void) {
      return html` <button @click=${listener}>X</button> `;
    },
    expectations: [
      {
        args: [
          (e: Event) => ((e.target as ClickableButton).__wasClicked = true),
        ],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const button = dom.querySelector('button')!;
          button.click();
          assert.strictEqual(
            (button as ClickableButton).__wasClicked,
            true,
            'not clicked during first render'
          );
        },
      },
      {
        args: [
          (e: Event) => ((e.target as ClickableButton).__wasClicked2 = true),
        ],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const button = dom.querySelector('button')!;
          button.click();
          assert.strictEqual(
            (button as ClickableButton).__wasClicked2,
            true,
            'not clicked during second render'
          );
        },
      },
    ],
    stableSelectors: ['button'],
  },

  'EventPart accepts directive: guard': () => {
    const listener1 = (e: Event) =>
      ((e.target as ClickableButton).__wasClicked = true);
    const listener2 = (e: Event) =>
      ((e.target as ClickableButton).__wasClicked2 = true);
    let guardedCallCount = 0;
    const guardedValue = (fn: (e: Event) => unknown) => {
      guardedCallCount++;
      return fn;
    };
    return {
      render(fn: (e: Event) => unknown) {
        return html`
          <button @click="${guard([fn], () => guardedValue(fn))}">X</button>
        `;
      },
      expectations: [
        {
          args: [listener1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked,
              true,
              'not clicked during first render'
            );
          },
        },
        {
          args: [listener1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked,
              true,
              'not clicked during second render'
            );
          },
        },
        {
          args: [listener2],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 2);
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked,
              true,
              'not clicked during third render'
            );
          },
        },
      ],
      stableSelectors: ['button'],
    };
  },

  'EventPart accepts directive: until (listener)': () => {
    const listener1 = (e: Event) =>
      ((e.target as ClickableButton).__wasClicked = true);
    const listener2 = (e: Event) =>
      ((e.target as ClickableButton).__wasClicked2 = true);
    return {
      render(...args) {
        return html` <button @click="${until(...args)}">X</button> `;
      },
      expectations: [
        {
          args: [listener1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked,
              true,
              'not clicked during first render'
            );
          },
        },
        {
          args: [listener2],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked2,
              true,
              'not clicked during second render'
            );
          },
        },
      ],
      stableSelectors: ['button'],
    };
  },

  'EventPart accepts directive: until (promise, listener)': () => {
    const listener1 = (e: Event) =>
      ((e.target as ClickableButton).__wasClicked = true);
    const listener2 = (e: Event) =>
      ((e.target as ClickableButton).__wasClicked2 = true);
    let resolve: (v: (e: Event) => any) => void;
    const promise = new Promise((r) => (resolve = r));
    return {
      render(...args) {
        return html` <button @click="${until(...args)}">X</button> `;
      },
      expectations: [
        {
          args: [promise, listener1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked,
              true,
              'not clicked during first render'
            );
          },
        },
        {
          async setup() {
            resolve(listener2);
            await promise;
          },
          args: [promise, listener1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked2,
              true,
              'not clicked during second render'
            );
          },
        },
      ],
      stableSelectors: ['button'],
    };
  },

  'EventPart accepts directive: until (promise, promise)': () => {
    const listener1 = (e: Event) =>
      ((e.target as ClickableButton).__wasClicked = true);
    const listener2 = (e: Event) =>
      ((e.target as ClickableButton).__wasClicked2 = true);
    let resolve1: (v: (e: Event) => any) => void;
    let resolve2: (v: (e: Event) => any) => void;
    const promise1 = new Promise((r) => (resolve1 = r));
    const promise2 = new Promise((r) => (resolve2 = r));
    return {
      render(...args) {
        return html` <button @click="${until(...args)}">X</button> `;
      },
      expectations: [
        {
          args: [promise2, promise1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.notProperty(
              dom.querySelector('button') as ClickableButton,
              '__wasClicked'
            );
            const button = dom.querySelector('button')!;
            button.click();
            assert.notProperty(
              button,
              '__wasClicked',
              'was clicked during first render'
            );
          },
        },
        {
          async setup() {
            resolve1(listener1);
            await promise1;
          },
          args: [promise2, promise1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked,
              true,
              'not clicked during second render'
            );
          },
        },
        {
          async setup() {
            resolve2(listener2);
            await promise2;
          },
          args: [promise2, promise1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual(
              (button as ClickableButton).__wasClicked2,
              true,
              'not clicked during third render'
            );
          },
        },
      ],
      stableSelectors: ['button'],
    };
  },

  'EventPart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html` <button @click="${ifDefined(v)}">X</button> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.notProperty(
            dom.querySelector('button') as ClickableButton,
            '__wasClicked'
          );
          const button = dom.querySelector('button')!;
          button.click();
          assert.notProperty(
            button,
            '__wasClicked',
            'was clicked during first render'
          );
        },
      },
      {
        args: [
          (e: Event) => ((e.target as ClickableButton).__wasClicked = true),
        ],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const button = dom.querySelector('button')!;
          button.click();
          assert.strictEqual(
            (button as ClickableButton).__wasClicked,
            true,
            'not clicked during second render'
          );
        },
      },
    ],
    stableSelectors: ['button'],
  },

  'EventPart accepts directive: ifDefined (defined)': {
    render(v) {
      return html` <button @click="${ifDefined(v)}">X</button> `;
    },
    expectations: [
      {
        args: [
          (e: Event) => ((e.target as ClickableButton).__wasClicked = true),
        ],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const button = dom.querySelector('button')!;
          button.click();
          assert.strictEqual(
            (button as ClickableButton).__wasClicked,
            true,
            'not clicked during second render'
          );
        },
      },
      {
        args: [undefined],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.notProperty(
            dom.querySelector('button') as ClickableButton,
            '__wasClicked1'
          );
          const button = dom.querySelector('button')!;
          button.click();
          assert.notProperty(
            button,
            '__wasClicked1',
            'was clicked during first render'
          );
        },
      },
    ],
    stableSelectors: ['button'],
  },

  'EventPart on a void element': {
    render(listener: (e: Event) => void) {
      return html`<input @click=${listener} />`;
    },
    expectations: [
      {
        args: [
          (e: Event) => ((e.target as ClickableInput).__wasClicked = true),
        ],
        html: '<input>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const input = dom.querySelector('input')!;
          input.click();
          assert.strictEqual(
            (input as ClickableInput).__wasClicked,
            true,
            'not clicked during first render'
          );
        },
      },
      {
        args: [
          (e: Event) => ((e.target as ClickableInput).__wasClicked2 = true),
        ],
        html: '<input>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const input = dom.querySelector('input')!;
          input.click();
          assert.strictEqual(
            (input as ClickableInput).__wasClicked2,
            true,
            'not clicked during second render'
          );
        },
      },
    ],
    stableSelectors: ['input'],
  },

  /******************************************************
   * BooleanAttributePart tests
   ******************************************************/

  'BooleanAttributePart, initially true': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [true],
        html: '<div hidden></div>',
      },
      {
        args: [false],
        html: '<div></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially truthy (number)': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [1],
        html: '<div hidden></div>',
      },
      {
        args: [false],
        html: '<div></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially truthy (object)': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [{}],
        html: '<div hidden></div>',
      },
      {
        args: [false],
        html: '<div></div>',
      },
    ],
    stableSelectors: ['div'],
    // Objects never dirty-check, so they cause a setAttribute despite being hydrated
    expectMutationsOnFirstRender: true,
  },

  'BooleanAttributePart, initially false': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [false],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially falsey (number)': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [0],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially falsey (null)': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [null],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially falsey (undefined)': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially nothing': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially noChange': {
    render(hide: boolean) {
      return html` <div ?hidden=${hide}></div> `;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart accepts directive: guard': () => {
    let guardedCallCount = 0;
    const guardedValue = (bool: boolean) => {
      guardedCallCount++;
      return bool;
    };
    return {
      render(bool: boolean) {
        return html`
          <div ?hidden="${guard([bool], () => guardedValue(bool))}"></div>
        `;
      },
      expectations: [
        {
          args: [true],
          html: '<div hidden></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          },
        },
        {
          args: [true],
          html: '<div hidden></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          },
        },
        {
          args: [false],
          html: '<div></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 2);
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'BooleanAttributePart accepts directive: until (primitive)': {
    render(...args) {
      return html` <div ?hidden="${until(...args)}"></div> `;
    },
    expectations: [
      {
        args: [true],
        html: '<div hidden></div>',
      },
      {
        args: [false],
        html: '<div></div>',
      },
    ],
    stableSelectors: ['div'],
    // until always calls setValue each render, with no dirty-check of previous
    // value
    expectMutationsOnFirstRender: true,
  },

  'BooleanAttributePart accepts directive: until (promise, primitive)': () => {
    let resolve: (v: boolean) => void;
    const promise = new Promise((r) => (resolve = r));
    return {
      render(...args) {
        return html` <div ?hidden="${until(...args)}"></div> `;
      },
      expectations: [
        {
          args: [promise, true],
          html: '<div hidden></div>',
        },
        {
          async setup() {
            resolve(false);
            await promise;
          },
          args: [promise, true],
          html: '<div></div>',
        },
      ],
      stableSelectors: ['div'],
      // until always calls setValue each render, with no dirty-check of previous
      // value
      expectMutationsOnFirstRender: true,
    };
  },

  'BooleanAttributePart accepts directive: until (promise, promise)': () => {
    let resolve1: (v: boolean) => void;
    let resolve2: (v: boolean) => void;
    const promise1 = new Promise((r) => (resolve1 = r));
    const promise2 = new Promise((r) => (resolve2 = r));
    return {
      render(...args) {
        return html` <div ?hidden="${until(...args)}"></div> `;
      },
      expectations: [
        {
          args: [promise2, promise1],
          html: '<div></div>',
        },
        {
          async setup() {
            resolve1(true);
            await promise1;
          },
          args: [promise2, promise1],
          html: '<div hidden></div>',
        },
        {
          async setup() {
            resolve2(false);
            await promise2;
          },
          args: [promise2, promise1],
          html: '<div></div>',
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'BooleanAttributePart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html` <div ?hidden="${ifDefined(v)}"></div> `;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
      },
      {
        args: ['foo'],
        html: '<div hidden></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart accepts directive: ifDefined (defined)': {
    render(v) {
      return html` <div ?hidden="${ifDefined(v)}"></div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div hidden></div>',
      },
      {
        args: [undefined],
        html: '<div></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart accepts directive: live': {
    render(v: boolean) {
      return html` <div ?hidden="${live(v)}"></div> `;
    },
    expectations: [
      {
        args: [true],
        html: '<div hidden></div>',
      },
      {
        args: [false],
        html: '<div></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart on a void element': {
    render(hide: boolean) {
      return html` <input ?hidden=${hide} /> `;
    },
    expectations: [
      {
        args: [true],
        html: '<input hidden>',
      },
      {
        args: [false],
        html: '<input>',
      },
    ],
    stableSelectors: ['input'],
  },

  /******************************************************
   * ElementPart tests
   ******************************************************/

  'ElementPart accepts directive: generic': () => {
    const log: string[] = [];
    const dir = directive(
      class extends Directive {
        render(_v: string) {
          log.push('render should not be called');
        }
        override update(_part: Part, [v]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          log.push(v);
        }
      }
    );
    return {
      render(v: string) {
        return html` <div attr=${v} ${dir(v)}></div> `;
      },
      expectations: [
        {
          args: ['a'],
          html: '<div attr="a"></div>',
          check(assert: Chai.Assert) {
            // Note, update is called once during hydration and again
            // during initial render
            assert.deepEqual(log, ['a', 'a']);
          },
        },
        {
          args: ['b'],
          html: '<div attr="b"></div>',
          check(assert: Chai.Assert) {
            assert.deepEqual(log, ['a', 'a', 'b']);
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'ElementPart accepts directive: ref': () => {
    const ref1 = createRef();
    const ref2 = createRef();
    const ref3 = createRef();
    return {
      render(v: boolean) {
        return html`
          <div id="div1" ${ref(ref1)}>
            <div id="div2" ${ref(ref2)}>
              ${v ? html` <div id="div3" ${ref(ref3)}></div> ` : nothing}
            </div>
          </div>
        `;
      },
      expectations: [
        {
          args: [true],
          html: '<div id="div1"><div id="div2"><div id="div3"></div></div></div>',
          check(assert: Chai.Assert) {
            assert.equal(ref1.value?.id, 'div1');
            assert.equal(ref2.value?.id, 'div2');
            assert.equal(ref3.value?.id, 'div3');
          },
        },
        {
          args: [false],
          html: '<div id="div1"><div id="div2"></div></div>',
          check(assert: Chai.Assert) {
            assert.equal(ref1.value?.id, 'div1');
            assert.equal(ref2.value?.id, 'div2');
            assert.notOk(ref3.value);
          },
        },
      ],
      stableSelectors: ['div'],
    };
  },

  'ElementPart on void element': () => {
    const inputRef = createRef();
    return {
      render() {
        return html` <input ${ref(inputRef)} /> `;
      },
      expectations: [
        {
          args: [],
          html: '<input>',
          check(assert: Chai.Assert) {
            assert.equal(inputRef.value?.localName, 'input');
          },
        },
      ],
      stableSelectors: ['input'],
    };
  },

  /******************************************************
   * Mixed part tests
   ******************************************************/

  'ChildParts & AttributeParts on adjacent nodes': {
    render(x, y) {
      return html`
        <div attr="${x}">${x}</div>
        <div attr="${y}">${y}</div>
      `;
    },
    expectations: [
      {
        args: ['x', 'y'],
        html: '<div attr="x">x</div><div attr="y">y</div>',
      },
      {
        args: ['a', 'b'],
        html: '<div attr="a">a</div><div attr="b">b</div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildParts & AttributeParts on nested nodes': {
    render(x, y) {
      return html`
        <div attr="${x}">
          ${x}
          <div attr="${y}">${y}</div>
        </div>
      `;
    },
    expectations: [
      {
        args: ['x', 'y'],
        html: '<div attr="x">x<div attr="y">y</div></div>',
      },
      {
        args: ['a', 'b'],
        html: '<div attr="a">a<div attr="b">b</div></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'ChildPart, AttributePart, and ElementPart soup': {
    render(x, y, z) {
      return html`
        text:${x}
        <div>${x}</div>
        <span a1="${y}" a2="${y}"
          >${x}
          <p a="${y}">${y}</p>
          ${z}</span
        >
      `;
    },
    expectations: [
      {
        args: [html` <a attr=${'a'} ${'ignored'}></a> `, 'b', 'c'],
        html: 'text:\n<a attr="a"></a><div><a attr="a"></a></div><span a1="b" a2="b"><a attr="a"></a><p a="b">b</p>c</span>',
      },
      {
        args: ['x', 'y', html` <i ${'ignored'} attr=${'i'}></i> `],
        html: 'text:x\n<div>x</div><span a1="y" a2="y">x<p a="y">y</p><i attr="i"></i></span>',
      },
    ],
    stableSelectors: ['div', 'span', 'p'],
  },

  'ElementPart followed by Multiple AttributeParts': {
    render(x, y) {
      const ref1 = createRef();
      return html` <div ${ref(ref1)} x=${x} y=${y}></div> `;
    },
    expectations: [
      {
        args: ['x', 'y'],
        html: '<div x="x" y="y"></div>',
      },
    ],
    stableSelectors: ['div'],
  },

  'All part types with at various depths': () => {
    const handler1 = (e: Event) => ((e.target as any).triggered1 = true);
    const handler2 = (e: Event) => ((e.target as any).triggered2 = true);
    const checkDiv = (
      assert: Chai.Assert,
      dom: HTMLElement,
      id: string,
      x: unknown,
      triggerProp: string
    ) => {
      const div = dom.querySelector(`#${id}`) as HTMLElement;
      assert.ok(div, `Div ${id} not found`);
      div.click();
      assert.equal(
        (div as any)[triggerProp],
        true,
        `Event not triggered for ${id}`
      );
      assert.equal((div as any).p, x, `Property not set for ${id}`);
    };
    const dir = directive(
      class extends Directive {
        value: string | undefined;
        override update(_part: Part, [v]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          return this.render(v);
        }
        render(value: string) {
          if (this.value !== value) {
            this.value = value;
            return value ? `[${value}]` : value;
          }
          return noChange;
        }
      }
    );
    const check = (
      assert: Chai.Assert,
      dom: HTMLElement,
      x: unknown,
      triggerProp: string
    ) => {
      for (let i = 0; i < 2; i++) {
        checkDiv(assert, dom, `div${i}`, x, triggerProp);
        for (let j = 0; j < 2; j++) {
          checkDiv(assert, dom, `div${i}-${j}`, x, triggerProp);
          for (let k = 0; k < 3; k++) {
            checkDiv(assert, dom, `div${i}-${j}-${k}`, x, triggerProp);
          }
        }
      }
    };
    return {
      render(x, y, z, h) {
        return html`
          <div
            id="div0"
            a1=${x}
            a2="[${x}-${y}]"
            a3="(${dir(x)})"
            .p=${x}
            @click=${h}
            ?b=${x}
          >
            ${x}
            <div
              id="div0-0"
              a1=${x}
              a2="[${x}-${y}]"
              a3="(${dir(x)})"
              .p=${x}
              @click=${h}
              ?b=${x}
            >
              ${y}
              <div
                id="div0-0-0"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
              <div
                id="div0-0-1"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
              <span>static</span>
              <div
                id="div0-0-2"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
            </div>
            <span>static</span>
            <span>static</span>
            <div
              id="div0-1"
              a1=${x}
              a2="[${x}-${y}]"
              a3="(${dir(x)})"
              .p=${x}
              @click=${h}
              ?b=${x}
            >
              ${y}
              <div
                id="div0-1-0"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
              <div
                id="div0-1-1"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
              <span>static</span>
              <div
                id="div0-1-2"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
            </div>
          </div>
          <div
            id="div1"
            a1=${x}
            a2="[${x}-${y}]"
            a3="(${dir(x)})"
            .p=${x}
            @click=${h}
            ?b=${x}
          >
            ${x}
            <div
              id="div1-0"
              a1=${x}
              a2="[${x}-${y}]"
              a3="(${dir(x)})"
              .p=${x}
              @click=${h}
              ?b=${x}
            >
              ${y}
              <div
                id="div1-0-0"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
              <div
                id="div1-0-1"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
              <span>static</span>
              <div
                id="div1-0-2"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
            </div>
            <span>static</span>
            <span>static</span>
            <div
              id="div1-1"
              a1=${x}
              a2="[${x}-${y}]"
              a3="(${dir(x)})"
              .p=${x}
              @click=${h}
              ?b=${x}
            >
              ${y}
              <div
                id="div1-1-0"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
              <div
                id="div1-1-1"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
              <span>static</span>
              <div
                id="div1-1-2"
                a1=${x}
                a2="[${x}-${y}]"
                a3="(${dir(x)})"
                .p=${x}
                @click=${h}
                ?b=${x}
              >
                ${z}
              </div>
            </div>
          </div>
        `;
      },
      expectations: [
        {
          args: ['x', 'y', html` <a>z</a> `, handler1],
          html: `
          <div id="div0" a1="x" a2="[x-y]" a3="([x])" b>
            x
            <div id="div0-0" a1="x" a2="[x-y]" a3="([x])" b>
              y
              <div id="div0-0-0" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
              <div id="div0-0-1" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
              <span>static</span>
              <div id="div0-0-2" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
            </div>
            <span>static</span>
            <span>static</span>
            <div id="div0-1" a1="x" a2="[x-y]" a3="([x])" b>
              y
              <div id="div0-1-0" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
              <div id="div0-1-1" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
              <span>static</span>
              <div id="div0-1-2" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
            </div>
          </div>
          <div id="div1" a1="x" a2="[x-y]" a3="([x])" b>
            x
            <div id="div1-0" a1="x" a2="[x-y]" a3="([x])" b>
              y
              <div id="div1-0-0" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
              <div id="div1-0-1" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
              <span>static</span>
              <div id="div1-0-2" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
            </div>
            <span>static</span>
            <span>static</span>
            <div id="div1-1" a1="x" a2="[x-y]" a3="([x])" b>
              y
              <div id="div1-1-0" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
              <div id="div1-1-1" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
              <span>static</span>
              <div id="div1-1-2" a1="x" a2="[x-y]" a3="([x])" b>
                <a>z</a>
              </div>
            </div>
          </div>`,
          check(assert: Chai.Assert, dom: HTMLElement) {
            check(assert, dom, 'x', 'triggered1');
          },
        },
        {
          args: [0, 1, html` <b>2</b> `, handler2],
          html: `
          <div id="div0" a1="0" a2="[0-1]" a3="(0)">
            0
            <div id="div0-0" a1="0" a2="[0-1]" a3="(0)">
              1
              <div id="div0-0-0" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
              <div id="div0-0-1" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
              <span>static</span>
              <div id="div0-0-2" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
            </div>
            <span>static</span>
            <span>static</span>
            <div id="div0-1" a1="0" a2="[0-1]" a3="(0)">
              1
              <div id="div0-1-0" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
              <div id="div0-1-1" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
              <span>static</span>
              <div id="div0-1-2" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
            </div>
          </div>
          <div id="div1" a1="0" a2="[0-1]" a3="(0)">
            0
            <div id="div1-0" a1="0" a2="[0-1]" a3="(0)">
              1
              <div id="div1-0-0" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
              <div id="div1-0-1" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
              <span>static</span>
              <div id="div1-0-2" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
            </div>
            <span>static</span>
            <span>static</span>
            <div id="div1-1" a1="0" a2="[0-1]" a3="(0)">
              1
              <div id="div1-1-0" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
              <div id="div1-1-1" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
              <span>static</span>
              <div id="div1-1-2" a1="0" a2="[0-1]" a3="(0)">
                <b>2</b>
              </div>
            </div>
          </div>`,
          check(assert: Chai.Assert, dom: HTMLElement) {
            check(assert, dom, 0, 'triggered2');
          },
        },
      ],
      stableSelectors: ['div', 'span'],
    };
  },

  /******************************************************
   * Static html tests
   ******************************************************/

  'Static html': {
    render(x: unknown) {
      const tagName = x === 'foo' ? literal`div` : literal`p`;
      return staticHtml`<${tagName}>${x}</${tagName}>`;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
      {
        args: ['foo2'],
        html: '<p>foo2</p>',
      },
    ],
    stableSelectors: [],
  },

  /******************************************************
   * AsyncDirective tests
   ******************************************************/

  AsyncDirective: () => {
    const log: string[] = [];
    const dir = directive(
      class extends AsyncDirective {
        id!: string;
        render(id: string) {
          this.id = id;
          log.push(`render-${this.id}`);
          return id;
        }
        override disconnected() {
          log.push(`disconnected-${this.id}`);
        }
      }
    );
    return {
      render(bool: boolean, id: string) {
        return html`
          <span
            >${dir('x')}${bool
              ? html`
                  <div attr=${dir(`attr-${id}`)}>${dir(`node-${id}`)}</div>
                `
              : nothing}</span
          >
        `;
      },
      expectations: [
        {
          args: [true, 'a'],
          html: '<span>x<div attr="attr-a">node-a</div></span>',
          check(assert: Chai.Assert) {
            // Note, update is called once during hydration and again
            // during initial render
            assert.deepEqual(log, [
              'render-x',
              'render-attr-a',
              'render-node-a',
              'render-x',
              'render-attr-a',
              'render-node-a',
            ]);
            log.length = 0;
          },
        },
        {
          args: [false, 'a'],
          html: '<span>x</span>',
          check(assert: Chai.Assert) {
            assert.deepEqual(log, [
              'render-x',
              'disconnected-attr-a',
              'disconnected-node-a',
            ]);
            log.length = 0;
          },
        },
        {
          args: [true, 'b'],
          html: '<span>x<div attr="attr-b">node-b</div></span>',
          check(assert: Chai.Assert) {
            assert.deepEqual(log, [
              'render-x',
              'render-attr-b',
              'render-node-b',
            ]);
            log.length = 0;
          },
        },
        {
          args: [false, 'b'],
          html: '<span>x</span>',
          check(assert: Chai.Assert) {
            assert.deepEqual(log, [
              'render-x',
              'disconnected-attr-b',
              'disconnected-node-b',
            ]);
            log.length = 0;
          },
        },
      ],
      stableSelectors: ['span'],
    };
  },

  /******************************************************
   * Nested directive tests
   ******************************************************/

  'Nested directives': () => {
    const log: number[] = [];
    const nest = directive(
      class extends Directive {
        override update(_part: Part, [n]: DirectiveParameters<this>) {
          throwIfRunOnServer();
          return this.render(n);
        }
        render(n: number): string | DirectiveResult {
          log.push(n);
          if (n > 1) {
            return nest(n - 1);
          } else {
            return 'nested!';
          }
        }
      }
    );
    return {
      render() {
        return html` <span>${nest(3)}</span> `;
      },
      expectations: [
        {
          args: [],
          html: '<span>nested!</span>',
          check(assert: Chai.Assert) {
            // Note, update is called once during hydration and again
            // during initial render
            assert.deepEqual(log, [3, 2, 1, 3, 2, 1]);
            log.length = 0;
          },
        },
        {
          args: [],
          html: '<span>nested!</span>',
          check(assert: Chai.Assert) {
            assert.deepEqual(log, [3, 2, 1]);
            log.length = 0;
          },
        },
      ],
      stableSelectors: ['span'],
    };
  },

  /******************************************************
   * Unknown element/renderer tests
   ******************************************************/

  'Unregistered custom element: Attributes': () => {
    return {
      render() {
        return html`
          <x-unregistered
            attr1
            attr2="attr2val"
            attr3=${'attr3val'}
          ></x-unregistered>
        `;
      },
      expectations: [
        {
          args: [],
          html: '<x-unregistered attr1 attr2="attr2val" attr3="attr3val"></x-unregistered>',
        },
      ],
      stableSelectors: ['x-unregistered'],
    };
  },

  'Custom element with no renderer: Attributes': () => {
    return {
      async registerElements() {
        // Extending LitElement always works, because we automatically shim
        // HTMLElement in the Node build of Lit. However, we don't automatically
        // set HTMLElement as a global. So, since these tests can run either
        // with or without the legacy global DOM shim installed, HTMLElement
        // might not be defined as a global here. We can import it directly from
        // the minimal DOM shim package, though.
        const HTMLElement =
          globalThis.HTMLElement ??
          (await import('@lit-labs/ssr-dom-shim')).HTMLElement;
        customElements.define('x-norenderer', class extends HTMLElement {});
      },
      render() {
        return html`
          <x-norenderer
            attr1
            attr2="attr2val"
            attr3=${'attr3val'}
          ></x-norenderer>
        `;
      },
      expectations: [
        {
          args: [],
          html: '<x-norenderer attr1 attr2="attr2val" attr3="attr3val"></x-norenderer>',
        },
      ],
      stableSelectors: ['x-norenderer'],
    };
  },

  /******************************************************
   * LitElement tests
   ******************************************************/

  'LitElement: Basic': () => {
    return {
      registerElements() {
        customElements.define(
          'le-basic',
          class extends LitElement {
            override render() {
              return html` <div>[le-basic: <slot></slot>]</div> `;
            }
          }
        );
      },
      render(x: string) {
        return html` <le-basic>${x}</le-basic> `;
      },
      expectations: [
        {
          args: ['x'],
          html: {
            root: `<le-basic>x</le-basic>`,
            'le-basic': `<div>[le-basic: <slot></slot>]</div>`,
          },
        },
      ],
      stableSelectors: ['le-basic'],
    };
  },

  'LitElement: Nested': () => {
    return {
      registerElements() {
        customElements.define(
          'le-nested1',
          class extends LitElement {
            override render() {
              return html`
                <div>
                  [le-nested1: <le-nested2><slot></slot></le-nested2>]
                </div>
              `;
            }
          }
        );
        customElements.define(
          'le-nested2',
          class extends LitElement {
            override render() {
              return html` <div>[le-nested2: <slot></slot>]</div> `;
            }
          }
        );
      },
      render(x: string) {
        return html` <le-nested1>${x}</le-nested1> `;
      },
      expectations: [
        {
          args: ['x'],
          html: {
            root: `<le-nested1>x</le-nested1>`,
            'le-nested1': {
              root: `<div>[le-nested1: <le-nested2><slot></slot></le-nested2>]</div>`,
              'le-nested2': `<div>[le-nested2: <slot></slot>]</div>`,
            },
          },
        },
      ],
      stableSelectors: ['le-nested1'],
    };
  },

  'LitElement: Property binding': () => {
    return {
      registerElements() {
        class LEPropBinding extends LitElement {
          @property()
          prop = 'default';
          override render() {
            return html` <div>[${this.prop}]</div> `;
          }
        }
        customElements.define('le-prop-binding', LEPropBinding);
      },
      render(prop: unknown) {
        return html` <le-prop-binding .prop=${prop}></le-prop-binding> `;
      },
      expectations: [
        {
          args: ['boundProp1'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-prop-binding')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'boundProp1');
          },
          html: {
            root: `<le-prop-binding></le-prop-binding>`,
            'le-prop-binding': `<div>\n  [boundProp1]\n</div>`,
          },
        },
        {
          args: ['boundProp2'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-prop-binding')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'boundProp2');
          },
          html: {
            root: `<le-prop-binding></le-prop-binding>`,
            'le-prop-binding': `<div>\n  [boundProp2]\n</div>`,
          },
        },
      ],
      stableSelectors: ['le-prop-binding'],
    };
  },

  'LitElement: willUpdate': () => {
    return {
      registerElements() {
        class LEWillUpdate extends LitElement {
          @property()
          first?: string;
          @property()
          last?: string;
          fullName = '';

          override willUpdate(changedProperties: PropertyValues) {
            if (
              changedProperties.has('first') ||
              changedProperties.has('last')
            ) {
              this.fullName = `${this.first} ${this.last}`;
            }
          }

          override render() {
            // prettier-ignore
            return html`<main>${this.fullName}</main>`;
          }
        }
        customElements.define('le-will-update', LEWillUpdate);
      },
      render(first?: string, last?: string) {
        return html`
          <le-will-update .first=${first} .last=${last}></le-will-update>
        `;
      },
      expectations: [
        {
          args: ['foo', 'bar'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-will-update')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).fullName, 'foo bar');
          },
          html: {
            root: `<le-will-update></le-will-update>`,
            'le-will-update': `<main>\n  foo bar\n</main>`,
          },
        },
        {
          args: ['zot', ''],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-will-update')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).fullName, 'zot ');
          },
          html: {
            root: `<le-will-update></le-will-update>`,
            'le-will-update': `<main>\n  zot\n</main>`,
          },
        },
      ],
      stableSelectors: ['le-will-update'],
    };
  },

  'LitElement: Reflected property binding': () => {
    return {
      registerElements() {
        class LEReflectedBinding extends LitElement {
          @property({reflect: true})
          prop = 'default';
          override render() {
            return html` <div>[${this.prop}]</div> `;
          }
        }
        customElements.define('le-reflected-binding', LEReflectedBinding);
      },
      render(prop: unknown) {
        return html`
          <le-reflected-binding .prop=${prop}></le-reflected-binding>
        `;
      },
      expectations: [
        {
          args: ['boundProp1'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-reflected-binding')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'boundProp1');
          },
          html: {
            root: `<le-reflected-binding prop="boundProp1"></le-reflected-binding>`,
            'le-reflected-binding': `<div>\n  [boundProp1]\n</div>`,
          },
        },
        {
          args: ['boundProp2'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-reflected-binding')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'boundProp2');
          },
          html: {
            root: `<le-reflected-binding prop="boundProp2"></le-reflected-binding>`,
            'le-reflected-binding': `<div>\n  [boundProp2]\n</div>`,
          },
        },
      ],
      stableSelectors: ['le-reflected-binding'],
      // LitElement unconditionally sets reflecting properties to attributes
      // on a property change, even if the attribute was already there
      expectMutationsDuringUpgrade: true,
      expectMutationsDuringHydration: true,
    };
  },

  'LitElement: Attribute binding': () => {
    return {
      registerElements() {
        class LEAttrBinding extends LitElement {
          @property()
          prop = 'default';
          override render() {
            return html` <div>[${this.prop}]</div> `;
          }
        }
        customElements.define('le-attr-binding', LEAttrBinding);
      },
      render(prop: unknown) {
        return html` <le-attr-binding prop=${prop} static></le-attr-binding> `;
      },
      expectations: [
        {
          args: ['boundProp1'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-attr-binding')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'boundProp1');
          },
          html: {
            root: `<le-attr-binding prop="boundProp1" static></le-attr-binding>`,
            'le-attr-binding': `<div>\n  [boundProp1]\n</div>`,
          },
        },
        {
          args: ['boundProp2'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-attr-binding')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'boundProp2');
          },
          html: {
            root: `<le-attr-binding prop="boundProp2" static></le-attr-binding>`,
            'le-attr-binding': `<div>\n  [boundProp2]\n</div>`,
          },
        },
        {
          args: [undefined],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-attr-binding')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, '');
          },
          html: {
            root: `<le-attr-binding prop="" static></le-attr-binding>`,
            'le-attr-binding': `<div>\n  []\n</div>`,
          },
        },
        {
          args: [null],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-attr-binding')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, '');
          },
          html: {
            root: `<le-attr-binding prop="" static></le-attr-binding>`,
            'le-attr-binding': `<div>\n  []\n</div>`,
          },
        },
      ],
      stableSelectors: ['le-attr-binding'],
    };
  },

  'LitElement: Attribute binding (mixed case)': () => {
    return {
      registerElements() {
        class LEMixedAttrBinding extends LitElement {
          @property()
          camelProp = 'default';
          override render() {
            return html` <div>[${this.camelProp}]</div> `;
          }
        }
        customElements.define('le-mixed-attr-binding', LEMixedAttrBinding);
      },
      render(prop: unknown) {
        return html`
          <le-mixed-attr-binding
            camelProp=${prop}
            static
          ></le-mixed-attr-binding>
        `;
      },
      expectations: [
        {
          args: ['boundProp1'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-mixed-attr-binding'
            )! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).camelProp, 'boundProp1');
          },
          html: {
            root: `<le-mixed-attr-binding camelprop="boundProp1" static></le-mixed-attr-binding>`,
            'le-mixed-attr-binding': `<div>\n  [boundProp1]\n</div>`,
          },
        },
        {
          args: ['boundProp2'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-mixed-attr-binding'
            )! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).camelProp, 'boundProp2');
          },
          html: {
            root: `<le-mixed-attr-binding camelprop="boundProp2" static></le-mixed-attr-binding>`,
            'le-mixed-attr-binding': `<div>\n  [boundProp2]\n</div>`,
          },
        },
        {
          args: [undefined],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-mixed-attr-binding'
            )! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).camelProp, '');
          },
          html: {
            root: `<le-mixed-attr-binding camelprop="" static></le-mixed-attr-binding>`,
            'le-mixed-attr-binding': `<div>\n  []\n</div>`,
          },
        },
        {
          args: [null],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-mixed-attr-binding'
            )! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).camelProp, '');
          },
          html: {
            root: `<le-mixed-attr-binding camelprop="" static></le-mixed-attr-binding>`,
            'le-mixed-attr-binding': `<div>\n  []\n</div>`,
          },
        },
      ],
      stableSelectors: ['le-mixed-attr-binding'],
    };
  },

  'LitElement: Reflected number attribute': () => {
    return {
      registerElements() {
        class LEReflectedNumberAttribute extends LitElement {
          @property({type: Number, reflect: true})
          num = 42;
        }
        customElements.define(
          'le-reflected-number-attribute',
          LEReflectedNumberAttribute
        );
      },
      render() {
        return html`
          <le-reflected-number-attribute></le-reflected-number-attribute>
        `;
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-reflected-number-attribute'
            )! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as unknown as {num: number}).num, 42);
          },
          html: {
            root: `<le-reflected-number-attribute num="42"></le-reflected-number-attribute>`,
          },
        },
      ],
      stableSelectors: ['le-reflected-number-attribute'],
      // The property gets re-reflected to an attribute on upgrade.
      expectMutationsDuringUpgrade: true,
      expectMutationsDuringHydration: true,
    };
  },

  'LitElement: Reflected boolean attribute': () => {
    return {
      registerElements() {
        class LEReflectedBooleanObjectAttribute extends LitElement {
          @property({type: Boolean, reflect: true})
          bool = true;
        }
        customElements.define(
          'le-reflected-boolean-attribute',
          LEReflectedBooleanObjectAttribute
        );
      },
      render() {
        return html`
          <le-reflected-boolean-attribute></le-reflected-boolean-attribute>
        `;
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-reflected-boolean-attribute'
            )! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as unknown as {bool: boolean}).bool, true);
          },
          html: {
            root: `<le-reflected-boolean-attribute bool></le-reflected-boolean-attribute>`,
          },
        },
      ],
      stableSelectors: ['le-reflected-boolean-attribute'],
      // The property gets re-reflected to an attribute on upgrade.
      expectMutationsDuringUpgrade: true,
      expectMutationsDuringHydration: true,
    };
  },

  'LitElement: Reflected object attribute': () => {
    return {
      registerElements() {
        class LEReflectedObjectAttribute extends LitElement {
          @property({type: Object, reflect: true})
          obj = {foo: 42};
        }
        customElements.define(
          'le-reflected-object-attribute',
          LEReflectedObjectAttribute
        );
      },
      render() {
        return html`
          <le-reflected-object-attribute></le-reflected-object-attribute>
        `;
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-reflected-object-attribute'
            )! as LitElement;
            await el.updateComplete;
            assert.strictEqual(
              (el as unknown as {obj: {foo: number}}).obj.foo,
              42
            );
          },
          html: {
            root: `<le-reflected-object-attribute obj="{&quot;foo&quot;:42}"></le-reflected-object-attribute>`,
          },
        },
      ],
      stableSelectors: ['le-reflected-object-attribute'],
      // The property gets re-reflected to an attribute on upgrade.
      expectMutationsDuringUpgrade: true,
      expectMutationsDuringHydration: true,
    };
  },

  'LitElement: Reflected custom attribute': () => {
    return {
      registerElements() {
        class LEReflectedCustomAttribute extends LitElement {
          @property({
            converter: {
              fromAttribute: (value: string) => {
                return [...value].reverse().join('');
              },
              toAttribute: (value: string) => {
                return [...value].reverse().join('');
              },
            },
            reflect: true,
          })
          custom = 'abc';
        }
        customElements.define(
          'le-reflected-custom-attribute',
          LEReflectedCustomAttribute
        );
      },
      render() {
        return html`
          <le-reflected-custom-attribute></le-reflected-custom-attribute>
        `;
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-reflected-custom-attribute'
            )! as LitElement;
            await el.updateComplete;
            assert.strictEqual(
              (el as unknown as {custom: string}).custom,
              'abc'
            );
          },
          html: {
            root: `<le-reflected-custom-attribute custom="cba"></le-reflected-custom-attribute>`,
          },
        },
      ],
      stableSelectors: ['le-reflected-custom-attribute'],
      // The property gets re-reflected to an attribute on upgrade.
      expectMutationsDuringUpgrade: true,
      expectMutationsDuringHydration: true,
    };
  },

  'LitElement: Static attribute deserializes': () => {
    return {
      registerElements() {
        class LEStaticAttr extends LitElement {
          @property()
          prop = 'default';
          override render() {
            return html` <div>[${this.prop}]</div> `;
          }
        }
        customElements.define('le-static-attr', LEStaticAttr);
      },
      render() {
        return html` <le-static-attr prop="static" static></le-static-attr> `;
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-static-attr')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'static');
          },
          html: {
            root: `<le-static-attr prop="static" static></le-static-attr>`,
            'le-static-attr': `<div>\n  [static]\n</div>`,
          },
        },
      ],
      stableSelectors: ['le-attr-binding'],
    };
  },

  'LitElement: TemplateResult->Node binding': () => {
    return {
      registerElements() {
        class LENodeBinding extends LitElement {
          @property()
          template: unknown = 'default';
          override render() {
            return html` <div>${this.template}</div> `;
          }
        }
        customElements.define('le-node-binding', LENodeBinding);
      },
      render(template: (s: string) => any) {
        return html`
          <le-node-binding .template=${template('shadow')}
            >${template('light')}</le-node-binding
          >
        `;
      },
      expectations: [
        {
          args: [(s: string) => html` [template1: ${s}] `],
          async check(_assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-node-binding')! as LitElement;
            await el.updateComplete;
          },
          html: {
            root: `<le-node-binding>\n  [template1: light]\n</le-node-binding>`,
            'le-node-binding': `<div>\n  [template1: shadow]\n</div>`,
          },
        },
        {
          args: [(s: string) => html` [template2: ${s}] `],
          async check(_assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-node-binding')! as LitElement;
            await el.updateComplete;
          },
          html: {
            root: `<le-node-binding>\n  [template2: light]\n</le-node-binding>`,
            'le-node-binding': `<div>\n  [template2: shadow]\n</div>`,
          },
        },
      ],
      stableSelectors: ['le-node-binding'],
    };
  },

  'LitElement: renderLight': () => {
    return {
      registerElements() {
        class LERenderLight extends LitElement implements RenderLightHost {
          @property()
          prop = 'default';
          override render() {
            return html` <div>[shadow:${this.prop}<slot></slot>]</div> `;
          }
          renderLight() {
            return html` <div>[light:${this.prop}]</div> `;
          }
        }
        customElements.define('le-render-light', LERenderLight);
      },
      render(prop: unknown) {
        return html`
          <le-render-light .prop=${prop}>${renderLight()}</le-render-light>
        `;
      },
      expectations: [
        {
          args: ['boundProp1'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-render-light')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'boundProp1');
          },
          html: {
            root: `<le-render-light>\n  <div>\n    [light:boundProp1]\n  </div>\n</le-render-light>`,
            'le-render-light': `<div>\n  [shadow:boundProp1\n  <slot></slot>\n  ]\n</div>`,
          },
        },
        {
          args: ['boundProp2'],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-render-light')! as LitElement;
            await el.updateComplete;
            assert.strictEqual((el as any).prop, 'boundProp2');
          },
          html: {
            root: `<le-render-light>\n  <div>\n    [light:boundProp2]\n  </div>\n</le-render-light>`,
            'le-render-light': `<div>\n  [shadow:boundProp2\n  <slot></slot>\n  ]\n</div>`,
          },
        },
      ],
      stableSelectors: ['le-render-light'],
    };
  },

  'LitElement: hydration ordering': () => {
    const renderOrder: string[] = [];
    return {
      registerElements() {
        // When defined in bottom-up order (as they will typically be based on
        // import graph ordering), they should hydrate top-down
        class LEOrder3 extends LitElement {
          @property()
          prop = 'from3';
          override render() {
            renderOrder.push(this.localName);
            return html`le-order3:${this.prop}`;
          }
        }
        customElements.define('le-order3', LEOrder3);
        class LEOrder2 extends LitElement {
          @property()
          prop = 'from2';
          override render() {
            renderOrder.push(this.localName);
            return html`le-order2:${this.prop}<le-order3
                .prop=${this.prop}
              ></le-order3>`;
          }
        }
        customElements.define('le-order2', LEOrder2);
        class LEOrder1 extends LitElement {
          @property()
          prop = 'from1';
          override render() {
            renderOrder.push(this.localName);
            return html`le-order1:${this.prop}<le-order2
                .prop=${this.prop}
              ></le-order2>`;
          }
        }
        customElements.define('le-order1', LEOrder1);
        class LELight extends LitElement {
          override render() {
            renderOrder.push(this.localName);
            return html`le-light`;
          }
        }
        customElements.define('le-light', LELight);
      },
      render() {
        return html`<le-order1><le-light></le-light></le-order1>`;
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el1 = dom.querySelector('le-order1') as LitElement;
            await el1.updateComplete;
            const el2 = el1?.shadowRoot?.querySelector(
              'le-order2'
            ) as LitElement;
            await el2.updateComplete;
            const el3 = el2?.shadowRoot?.querySelector(
              'le-order3'
            ) as LitElement;
            await el3.updateComplete;
            assert.deepEqual(renderOrder, [
              'le-order1',
              'le-light',
              'le-order2',
              'le-order3',
            ]);
          },
          html: {
            root: `<le-order1><le-light></le-light></le-order1>`,
            'le-order1': {
              root: `le-order1:from1\n<le-order2></le-order2>`,
              'le-order2': {
                root: `le-order2:from1\n<le-order3></le-order3>`,
                'le-order3': {
                  root: 'le-order3:from1',
                },
              },
            },
          },
        },
      ],
      stableSelectors: ['le-order1'],
    };
  },

  'LitElement: defer hydration': () => {
    return {
      registerElements() {
        class LEDefer extends LitElement {
          @property({type: Number})
          clicked = 0;
          handleClick() {
            this.clicked += 1;
          }
          override render() {
            return html`<button @click=${this.handleClick}>X</button>`;
          }
        }
        customElements.define('le-defer', LEDefer);
      },
      render() {
        return html`<le-defer></le-defer>`;
      },
      serverRenderOptions: {
        deferHydration: true,
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-defer') as LitElement & {
              clicked: number;
            };
            const button = el.shadowRoot!.querySelector('button')!;
            button.click();
            assert.equal(el.clicked, 0);
            el.removeAttribute('defer-hydration');
            await el.updateComplete;
            button.click();
            await el.updateComplete;
            assert.equal(el.clicked, 1);
          },
          html: {
            root: `<le-defer></le-defer>`,
            'le-defer': `<button>X</button>`,
          },
        },
      ],
      stableSelectors: ['le-defer'],
    };
  },

  'LitElement: hydrate nested element without attrs': () => {
    // Regression test for https://github.com/lit/lit/issues/3939
    //
    // Confirms nested custom elements should have their defer-hydration
    // attribute removed when parent is hydrated even without any attributes or
    // bindings
    return {
      registerElements() {
        class LEParent extends LitElement {
          override render() {
            return html`<le-child></le-child>`;
          }
        }
        customElements.define('le-parent', LEParent);

        class LEChild extends LitElement {
          override render() {
            return html`le-child`;
          }
        }
        customElements.define('le-child', LEChild);
      },
      render() {
        return html`<le-parent></le-parent>`;
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const parent = dom.querySelector('le-parent') as LitElement;
            await parent.updateComplete;
            const child = parent.shadowRoot!.querySelector(
              'le-child'
            ) as LitElement;
            assert.isFalse(child.hasAttribute('defer-hydration'));
          },
          html: {
            root: `<le-parent></le-parent>`,
            'le-parent': {
              root: `<le-child></le-child>`,
            },
          },
        },
      ],
      stableSelectors: ['le-parent'],
    };
  },

  'LitElement: ElementInternals': () => {
    return {
      // ElementInternals is not implemented in Safari yet
      skip: Boolean(
        globalThis.navigator &&
          navigator.userAgent.includes('Safari/') &&
          navigator.userAgent.includes('Version/')
      ),
      registerElements() {
        class LEInternals extends LitElement {
          constructor() {
            super();
            const internals = this.attachInternals() as ElementInternals & {
              role: string;
            };
            internals.role = 'widget';
          }
        }
        customElements.define('le-internals', LEInternals);
      },
      render() {
        return html`<le-internals></le-internals>`;
      },
      serverRenderOptions: {
        deferHydration: true,
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-internals') as LitElement;
            assert.equal(el.getAttribute('role'), 'widget');
          },
          html: {
            root: `<le-internals role="widget" hydrate-internals-role="widget"></le-internals>`,
            'le-internals': ``,
          },
        },
      ],
      stableSelectors: ['le-internals'],
    };
  },

  'LitElement: ElementInternals with hydration': () => {
    return {
      // ElementInternals is not implemented in Safari yet
      skip: Boolean(
        globalThis.navigator &&
          navigator.userAgent.includes('Safari/') &&
          navigator.userAgent.includes('Version/')
      ),
      registerElements() {
        class LEInternalsHydrate extends LitElement {
          internals;
          constructor() {
            super();
            const internals = this.attachInternals() as ElementInternals & {
              role: string;
            };
            internals.role = 'widget';
            this.internals = internals;
          }
        }
        customElements.define('le-internals-hydrate', LEInternalsHydrate);
      },
      render() {
        return html`<le-internals-hydrate></le-internals-hydrate>`;
      },
      serverRenderOptions: {
        deferHydration: false,
      },
      expectations: [
        {
          args: [],
          async check(assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector(
              'le-internals-hydrate'
            ) as LitElement & {internals: {role: string}};
            assert.isFalse(el.hasAttribute('role'));
          },
          html: {
            root: `<le-internals-hydrate></le-internals-hydrate>`,
            'le-internals-hydrate': ``,
          },
        },
      ],
      expectMutationsDuringHydration: true,
      expectMutationsDuringUpgrade: true,
      skipPreHydrationAssertHtml: true,
      stableSelectors: ['le-internals-hydrate'],
    };
  },
  /******************************************************
   * Server-only template tests
   ******************************************************/
  'Server-only template works': {
    render(x: unknown) {
      return serverhtml` <div>${x}</div> `;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div>foo</div>',
      },
    ],
    stableSelectors: ['div'],
    serverOnly: true,
  },
  'Server-only template can bind into a rawtext element': {
    render(x: unknown) {
      return serverhtml`<head>
        <title>hello ${x}</title>
      </head>`;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<head><title>hello foo</title></head>',
      },
    ],
    stableSelectors: ['head', 'title'],
    serverOnly: true,
  },
  'Server-only template can render a basic LitElement': {
    registerElements() {
      customElements.define(
        'server-only-basic',
        class extends LitElement {
          override render() {
            return html`<div>[server rendered: <slot></slot>]</div>`;
          }
        }
      );
    },
    render(x: string) {
      return serverhtml`<server-only-basic>${x}</server-only-basic>`;
    },
    expectations: [
      {
        args: ['foo'],
        html: {
          root: `<server-only-basic>foo</server-only-basic>`,
          'server-only-basic': `<div>[server rendered: <slot></slot>]</div>`,
        },
      },
    ],
    stableSelectors: ['server-only-basic'],
    serverOnly: true,
  },
  'Server-only template can pass attributes to a LitElement': {
    registerElements() {
      class ServerOnlyAttrElement extends LitElement {
        @property() name: string = 'initial value';
        override render() {
          return html`<div>Hello ${this.name}</div>`;
        }
      }
      customElements.define('server-only-attr', ServerOnlyAttrElement);
    },
    render(attr: string) {
      return serverhtml`<server-only-attr name=${attr}></server-only-attr>`;
    },
    expectations: [
      {
        args: ['attribute from server'],
        html: {
          root: `<server-only-attr name="attribute from server"></server-only-attr>`,
          'server-only-attr': `<div>Hello attribute from server</div>`,
        },
      },
    ],
    stableSelectors: ['server-only-attr'],
    serverOnly: true,
  },
};

const serverClientHydrationTest: SSRTestDescription = {
  render(title: string, c1: string, c2: string) {
    return serverhtml`
        <!doctype html>
        <html>
          <head><title>${title}</title></head>
          <body>
            <div id="one">${this.renderFns?.renderOne(c1)}</div>
            <div id="two">${this.renderFns?.renderTwo(c2)}</div>
          </body>
        </html>
      `;
  },
  renderFns: {
    renderOne(c1: string) {
      return html`<h1>${c1}</h1>`;
    },
    renderTwo(c2: string) {
      return html`<h2>${c2}</h2>`;
    },
  },
  expectations: [
    {
      // Check that the server render is correct.
      args: ['title', 'c1', 'c2'],
      html: `
        <!doctype html>
        <html>
          <head><title>title</title></head>
          <body>
            <div id="one"><h1>c1</h1></div>
            <div id="two"><h2>c2</h2></div>
          </body>
        </html>
        `,
    },
    {
      // Hydrate #one with the same data
      hydrate: true,
      renderFn: 'renderOne',
      args: ['c1'],
      rootSelector: 'div#one',
      html: `
        <!doctype html>
        <html>
          <head><title>title</title></head>
          <body>
            <div id="one"><h1>c1</h1></div>
            <div id="two"><h2>c2</h2></div>
          </body>
        </html>
        `,
    },
    {
      // Update #one
      renderFn: 'renderOne',
      args: ['updated c1'],
      rootSelector: 'div#one',
      html: `
        <!doctype html>
        <html>
          <head><title>title</title></head>
          <body>
            <div id="one"><h1>updated c1</h1></div>
            <div id="two"><h2>c2</h2></div>
          </body>
        </html>
        `,
    },
    {
      // Hydrate #two
      hydrate: true,
      renderFn: 'renderTwo',
      args: ['c2'],
      rootSelector: 'div#two',
      html: `
        <!doctype html>
        <html>
          <head><title>title</title></head>
          <body>
            <div id="one"><h1>updated c1</h1></div>
            <div id="two"><h2>c2</h2></div>
          </body>
        </html>
        `,
    },
    {
      // Update #two
      renderFn: 'renderTwo',
      args: ['updated c2'],
      rootSelector: 'div#two',
      html: `
        <!doctype html>
        <html>
          <head><title>title</title></head>
          <body>
            <div id="one"><h1>updated c1</h1></div>
            <div id="two"><h2>updated c2</h2></div>
          </body>
        </html>
        `,
    },
  ],
  stableSelectors: [
    'html',
    'head',
    'title',
    'body',
    'div#one',
    'div#two',
    'h1',
    'h2',
  ],
  serverOnly: true as const,
};
tests['client templates inside server templates can hydrate'] =
  serverClientHydrationTest;
