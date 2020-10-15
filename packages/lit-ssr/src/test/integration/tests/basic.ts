/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import 'lit-element/hydrate-support.js';

import {html, noChange, nothing, directive, Directive} from 'lit-html';
import {repeat} from 'lit-html/directives/repeat.js';
import {guard} from 'lit-html/directives/guard.js';
import {cache} from 'lit-html/directives/cache.js';
import {classMap} from 'lit-html/directives/class-map.js';
import {styleMap} from 'lit-html/directives/style-map.js';
// import {until} from 'lit-html/directives/until.js';
// import {asyncAppend} from 'lit-html/directives/async-append.js';
// import {asyncReplace} from 'lit-html/directives/async-replace.js';
// import {TestAsyncIterable} from 'lit-html/test/lib/test-async-iterable.js';
import {ifDefined} from 'lit-html/directives/if-defined.js';
import {live} from 'lit-html/directives/live.js';
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';
import {unsafeSVG} from 'lit-html/directives/unsafe-svg.js';

import {LitElement} from 'lit-element';
import {property} from 'lit-element/decorators/property.js'
import {renderLight, RenderLightHost} from 'lit-html/directives/render-light.js';

import { SSRTest } from './ssr-test';


const filterNodes = (nodes: ArrayLike<Node>, nodeType: number) =>
  Array.from(nodes).filter(n => n.nodeType === nodeType);

export const tests: {[name: string] : SSRTest} = {

  // TODO: add suites (for now, delineating with comments)

  /******************************************************
   * NodePart tests
   ******************************************************/

  'NodePart accepts a string': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div>foo</div>'
      },
      {
        args: ['foo2'],
        html: '<div>foo2</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts a number': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: [123],
        html: '<div>123</div>'
      },
      {
        args: [456.789],
        html: '<div>456.789</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts undefined': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>'
      },
      {
        args: ['foo'],
        html: '<div>foo</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts null': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: [null],
        html: '<div></div>'
      },
      {
        args: ['foo'],
        html: '<div>foo</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts noChange': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>'
      },
      {
        args: ['foo'],
        html: '<div>foo</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts nothing': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>'
      },
      {
        args: ['foo'],
        html: '<div>foo</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts an object': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: [{}],
        html: '<div>[object Object]</div>'
      },
      {
        args: [{}],
        html: '<div>[object Object]</div>'
      }
    ],
    // Objects are not dirty-checked before being toString()'ed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'NodePart accepts an object with a toString method': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: [{toString() { return 'toString!'; }}],
        html: '<div>toString!</div>'
      },
      {
        args: [{toString() { return 'toString2!'; }}],
        html: '<div>toString2!</div>'
      }
    ],
    // Objects are not dirty-checked before being toString()'ed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'NodePart accepts a function': {
    render(x: any) {
      return html`<div>${x}</div>`;
    },
    expectations: [
      {
        args: [() => { throw new Error(); }],
        html: '<div>() => { throw new Error(); }</div>'
      },
      {
        args: [() => { throw new Error("2"); }],
        html: '<div>() => { throw new Error("2"); }</div>'
      }
    ],
    // Functions are not dirty-checked before being toString()'ed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'NodePart accepts TemplateResult': {
    render(x: any) {
      return html`<div>${html`<span>${x}</span>`}</div>`;
    },
    expectations: [
      {
        args: ['A'],
        html: '<div><span>A</span></div>'
      },
      {
        args: ['B'],
        html: '<div><span>B</span></div>'
      }
    ],
    stableSelectors: ['div', 'span'],
  },

  'multiple NodeParts, adjacent primitive values': {
    render(x: any, y: any) {
      return html`<div>${x}${y}</div>`;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div>AB</div>'
      },
      {
        args: ['C', 'D'],
        html: '<div>CD</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'multiple NodeParts, adjacent primitive & TemplateResult': {
    render(x: any, y: any) {
      return html`<div>${x}${html`<span>${y}</span>`}</div>`;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div>A\n  <span>B</span></div>'
      },
      {
        args: ['C', 'D'],
        html: '<div>C\n  <span>D</span></div>'
      }
    ],
    stableSelectors: ['div', 'span'],
  },

  'multiple NodeParts, adjacent TemplateResults': {
    render(x: any, y: any) {
      return html`<div>${html`<span>${x}</span>`}${html`<span>${y}</span>`}</div>`;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div><span>A</span><span>B</span></div>'
      },
      {
        args: ['C', 'D'],
        html: '<div><span>C</span><span>D</span></div>'
      }
    ],
    stableSelectors: ['div', 'span'],
  },

  'multiple NodeParts with whitespace': {
    render(x: any, y: any) {
      return html`<div>${x} ${y}</div>`;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div>A B</div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const childNodes = dom.querySelector('div')!.childNodes;
          const textContent = filterNodes(childNodes, Node.TEXT_NODE)
            .map(n => n.textContent);
          assert.deepEqual(textContent, ['A', ' ', 'B']);
        }
      },
      {
        args: ['C', 'D'],
        html: '<div>C D</div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const childNodes = dom.querySelector('div')!.childNodes;
          const textContent = filterNodes(childNodes, Node.TEXT_NODE)
            .map(n => n.textContent);
          assert.deepEqual(textContent, ['C', ' ', 'D']);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart with trailing whitespace': {
    render(x: any) {
      return html`<div>${x} </div>`;
    },
    expectations: [
      {
        args: ['A'],
        html: '<div>A\n  </div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const childNodes = dom.querySelector('div')!.childNodes;
          const textContent = filterNodes(childNodes, Node.TEXT_NODE)
            .map(n => n.textContent);
          assert.deepEqual(textContent, ['A', ' ']);
        }
      },
      {
        args: ['B'],
        html: '<div>B\n  </div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const childNodes = dom.querySelector('div')!.childNodes;
          const textContent = filterNodes(childNodes, Node.TEXT_NODE)
            .map(n => n.textContent);
          assert.deepEqual(textContent, ['B', ' ']);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts array with strings': {
    render(words: string[]) {
      return html`<div>${words}</div>`;
    },
    expectations: [
      {
        args: [['A', 'B', 'C']],
        html: '<div>ABC</div>'
      },
      {
        args: [['D', 'E', 'F']],
        html: '<div>DEF</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts array with strings, updated with fewer items': {
    render(words: string[]) {
     return html`<div>${words}</div>`;
    },
    expectations: [
      {
        args: [['A', 'B', 'C']],
        html: '<div>ABC</div>'
      },
      // Attribute hydration not working yet
      {
        args: [['D', 'E']],
        html: '<div>DE</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts array with strings, updated with more items': {
    render(words: string[]) {
      return html`<div>${words}</div>`;
    },
    expectations: [
      {
        args: [['A', 'B', 'C']],
        html: '<div>ABC</div>'
      },
      // Attribute hydration not working yet
      {
        args: [['D', 'E', 'F', 'G']],
        html: '<div>DEFG</div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'NodePart accepts array with templates': {
    render(words: string[]) {
      return html`<ol>${words.map((w) => html`<li>${w}</li>`)}</ol>`;
    },
    expectations: [
      {
        args: [['A', 'B', 'C']],
        html: '<ol><li>A</li>\n  <li>B</li>\n  <li>C</li></ol>'
      },
      {
        args: [['D', 'E', 'F']],
        html: '<ol><li>D</li>\n  <li>E</li>\n  <li>F</li></ol>'
      }
    ],
    stableSelectors: ['ol', 'li'],
  },

  'NodePart accepts directive: repeat (with strings)': {
    render(words: string[]) {
      return html`${repeat(words, (word, i) => `(${i} ${word})`)}`;
    },
    expectations: [
      {
        args: [['foo', 'bar', 'qux']],
        html: '(0 foo)(1 bar)(2 qux)'
      },
      {
        args: [['A', 'B', 'C']],
        html: '(0 A)(1 B)(2 C)'
      }
    ],
    stableSelectors: [],
  },

  'NodePart accepts directive: repeat (with templates)': {
    render(words: string[]) {
      return html`${repeat(words, (word, i) => html`<p>${i}) ${word}</p>`)}`;
    },
    expectations: [
      {
        args: [['foo', 'bar', 'qux']],
        html: '<p>\n  0) foo\n</p>\n<p>\n  1) bar\n</p>\n<p>\n  2) qux\n</p>\n'
      },
      {
        args: [['A', 'B', 'C']],
        html: '<p>\n  0) A\n</p>\n<p>\n  1) B\n</p>\n<p>\n  2) C\n</p>\n'
      }
    ],
    stableSelectors: ['p'],
  },

  'NodePart accepts directive: cache': {
    render(bool: boolean) {
      return html`${cache(bool ? html`<p>true</p>` : html`<b>false</b>` )}`;
    },
    expectations: [
      {
        args: [true],
        html: '<p>true</p>'
      },
      {
        args: [false],
        html: '<b>false</b>'
      },
      {
        args: [true],
        html: '<p>true</p>'
      }
    ],
    stableSelectors: [],
  },

  'NodePart accepts directive: guard': () => {
    let guardedCallCount = 0;
    const guardedTemplate = (bool: boolean) => {
      guardedCallCount++;
      return html`value is ${bool ? true : false}`;
    }
    return {
      render(bool: boolean) {
        return html`<div>${guard([bool], () => guardedTemplate(bool))}</div>`
      },
      expectations: [
        {
          args: [true],
          html: '<div>value is true</div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          }
        },
        {
          args: [true],
          html: '<div>value is true</div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          }
        },
        {
          args: [false],
          html: '<div>value is false</div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 2);
          }
        }
      ],
      stableSelectors: ['div'],
    };
  },

  // 'NodePart accepts directive: until (primitive)': {
  //   render(...args) {
  //     return html`<div>${until(...args)}</div>`
  //   },
  //   expectations: [
  //     {
  //       args: ['foo'],
  //       html: '<div>foo</div>',
  //     },
  //     {
  //       args: ['bar'],
  //       html: '<div>bar</div>',
  //     },
  //   ],
  //   stableSelectors: ['div'],
  // },

  // 'NodePart accepts directive: until (promise, primitive)': () => {
  //   let resolve: (v: string) => void;
  //   const promise = new Promise(r => resolve = r);
  //   return {
  //     render(...args) {
  //       return html`<div>${until(...args)}</div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise, 'foo'],
  //         html: '<div>foo</div>',
  //       },
  //       {
  //         async setup() {
  //           resolve('promise');
  //           await promise;
  //         },
  //         args: [promise, 'foo'],
  //         html: '<div>promise</div>',
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //   };
  // },

  // 'NodePart accepts directive: until (promise, promise)': () => {
  //   let resolve1: (v: string) => void;
  //   let resolve2: (v: string) => void;
  //   const promise1 = new Promise(r => resolve1 = r);
  //   const promise2 = new Promise(r => resolve2 = r);
  //   return {
  //     render(...args) {
  //       return html`<div>${until(...args)}</div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise2, promise1],
  //         html: '<div></div>',
  //       },
  //       {
  //         async setup() {
  //           resolve1('promise1');
  //           await promise1;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div>promise1</div>',
  //       },
  //       {
  //         async setup() {
  //           resolve2('promise2');
  //           await promise2;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div>promise2</div>',
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //   };
  // },

  // 'NodePart accepts directive: asyncAppend': () => {
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

  // 'NodePart accepts directive: asyncReplace': () => {
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

  'NodePart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html`<div>${ifDefined(v)}</div>`
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

  'NodePart accepts directive: ifDefined (defined)': {
    render(v) {
      return html`<div>${ifDefined(v)}</div>`
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

  'NodePart accepts directive: unsafeHTML': {
    render(v) {
      return html`<div>${unsafeHTML(v)}</div>`
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

  'NodePart accepts directive: unsafeSVG': {
    render(v) {
      return html`<svg>${unsafeSVG(v)}</svg>`
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
    stableSelectors: ['div'],
  },

  /******************************************************
   * AttributePart tests
   ******************************************************/

  'AttributePart accepts a string': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>'
      },
      {
        args: ['TEST2'],
        html: '<div class="TEST2"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts a number': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: [123],
        html: '<div class="123"></div>'
      },
      {
        args: [456.789],
        html: '<div class="456.789"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts undefined': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div class="undefined"></div>'
      },
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts null': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: [null],
        html: '<div class="null"></div>'
      },
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts noChange': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>'
      },
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts nothing': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>'
      },
      {
        args: ['TEST'],
        html: '<div class="TEST"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts an array': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: [['a', 'b', 'c']],
        html: '<div class="a,b,c"></div>'
      },
      {
        args: [['d', 'e', 'f']],
        html: '<div class="d,e,f"></div>'
      }
    ],
    stableSelectors: ['div'],
    // Setting an object/array always results in setAttribute being called
    expectMutationsOnFirstRender: true,
  },

  'AttributePart accepts an object': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: [{foo: 'bar'}],
        html: '<div class="[object Object]"></div>'
      },
      {
        args: [{ziz: 'zaz'}],
        html: '<div class="[object Object]"></div>'
      }
    ],
    stableSelectors: ['div'],
    // Setting an object/array always results in setAttribute being called
    expectMutationsOnFirstRender: true,
  },

  'AttributePart accepts an object with a toString method': {
    render(x: any) {
      return html`<div class=${x}></div>`;
    },
    expectations: [
      {
        args: [{toString() { return 'toString!'; }}],
        html: '<div class="toString!"></div>'
      },
      {
        args: [{toString() { return 'toString2!'; }}],
        html: '<div class="toString2!"></div>'
      }
    ],
    stableSelectors: ['div'],
    // Setting an object/array always results in setAttribute being called
    expectMutationsOnFirstRender: true,
  },

  'AttributePart accepts directive: classMap': {
    render(map: any) {
      return html`<div class=${classMap(map)}></div>`;
    },
    expectations: [
      {
        args: [{foo: true, bar: false, baz: true}],
        html: '<div class="foo baz"></div>'
      },
      {
        args: [{foo: false, bar: true, baz: true, zug: true}],
        html: '<div class="bar baz zug"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: classMap (with statics)': {
    render(map: any) {
      return html`<div class="static1 ${classMap(map)} static2"></div>`;
    },
    expectations: [
      {
        args: [{foo: true, bar: false, baz: true}],
        html: '<div class="static1 foo baz static2"></div>'
      },
      {
        args: [{foo: false, bar: true, baz: true, zug: true}],
        html: '<div class="static1 bar baz zug static2"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: styleMap': {
    render(map: any) {
      return html`<div style=${styleMap(map)}></div>`;
    },
    expectations: [
      {
        args: [{background: 'red', paddingTop: '10px', '--my-prop': 'green'}],
        html: '<div style="background: red; padding-top: 10px; --my-prop:green;"></div>'
      },
      {
        args: [{paddingTop: '20px', '--my-prop': 'gray', backgroundColor: 'white'}],
        html: '<div style="padding-top: 20px; --my-prop:gray; background-color: white;"></div>'
      }
    ],
    // styleMap does not dirty check individual properties before setting,
    // which causes an attribute mutation even if the text has not changed
    expectMutationsOnFirstRender: true,
    stableSelectors: ['div'],
  },

  'AttributePart accepts directive: styleMap (with statics)': {
    render(map: any) {
      return html`<div style="color: red; ${styleMap(map)} height: 3px;"></div>`;
    },
    expectations: [
      {
        args: [{background: 'green'}],
        html: '<div style="color: red; background: green; height: 3px;"></div>'
      },
      {
        args: [{paddingTop: '20px'}],
        html: '<div style="color: red; height: 3px; padding-top: 20px;"></div>'
      }
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
    }
    return {
      render(bool: boolean) {
        return html`<div attr="${guard([bool], () => guardedValue(bool))}"></div>`
      },
      expectations: [
        {
          args: [true],
          html: '<div attr="true"></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          }
        },
        {
          args: [true],
          html: '<div attr="true"></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          }
        },
        {
          args: [false],
          html: '<div attr="false"></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 2);
          }
        }
      ],
      stableSelectors: ['div'],
    };
  },

  // 'AttributePart accepts directive: until (primitive)': {
  //   render(...args) {
  //     return html`<div attr="${until(...args)}"></div>`
  //   },
  //   expectations: [
  //     {
  //       args: ['foo'],
  //       html: '<div attr="foo"></div>',
  //     },
  //     {
  //       args: ['bar'],
  //       html: '<div attr="bar"></div>',
  //     },
  //   ],
  //   stableSelectors: ['div'],
  //   // until always calls setValue each render, with no dirty-check of previous
  //   // value
  //   expectMutationsOnFirstRender: true,
  // },

  // 'AttributePart accepts directive: until (promise, primitive)': () => {
  //   let resolve: (v: string) => void;
  //   const promise = new Promise(r => resolve = r);
  //   return {
  //     render(...args) {
  //       return html`<div attr="${until(...args)}"></div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise, 'foo'],
  //         html: '<div attr="foo"></div>',
  //       },
  //       {
  //         async setup() {
  //           resolve('promise');
  //           await promise;
  //         },
  //         args: [promise, 'foo'],
  //         html: '<div attr="promise"></div>',
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //     // until always calls setValue each render, with no dirty-check of previous
  //     // value
  //     expectMutationsOnFirstRender: true,
  //   };
  // },

  // 'AttributePart accepts directive: until (promise, promise)': () => {
  //   let resolve1: (v: string) => void;
  //   let resolve2: (v: string) => void;
  //   const promise1 = new Promise(r => resolve1 = r);
  //   const promise2 = new Promise(r => resolve2 = r);
  //   return {
  //     render(...args) {
  //       return html`<div attr="${until(...args)}"></div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise2, promise1],
  //         html: '<div></div>',
  //       },
  //       {
  //         async setup() {
  //           resolve1('promise1');
  //           await promise1;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div attr="promise1"></div>',
  //       },
  //       {
  //         async setup() {
  //           resolve2('promise2');
  //           await promise2;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div attr="promise2"></div>',
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //   }
  // },

  'AttributePart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html`<div attr="${ifDefined(v)}"></div>`
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
      return html`<div attr="${ifDefined(v)}"></div>`
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
      return html`<div attr="${live(v)}"></div>`
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
    render(x: any, y: any) {
      return html`<div class=${x} foo=${y}></div>`;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div class="A" foo="B"></div>'
      },
      {
        args: ['C', 'D'],
        html: '<div class="C" foo="D"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'multiple AttributeParts in same attribute': {
    render(x: any, y: any) {
      return html`<div class="${x} ${y}"></div>`;
    },
    expectations: [
      {
        args: ['A', 'B'],
        html: '<div class="A B"></div>'
      },
      {
        args: ['C', 'D'],
        html: '<div class="C D"></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  'multiple AttributeParts across multiple attributes': {
    render(a: any, b: any, c: any, d: any, e: any, f: any) {
      return html`<div ab="${a} ${b}" x c="${c}" y de="${d} ${e}" f="${f}" z></div>`;
    },
    expectations: [
      {
        args: ['a', 'b', 'c', 'd', 'e', 'f'],
        html: '<div ab="a b" x c="c" y de="d e" f="f" z></div>'
      },
      {
        args: ['A', 'B', 'C', 'D', 'E', 'F'],
        html: '<div ab="A B" x c="C" y de="D E" f="F" z></div>'
      }
    ],
    stableSelectors: ['div'],
  },

  /******************************************************
   * PropertyPart tests
   ******************************************************/

  'PropertyPart accepts a string': {
    render(x: any) {
      return html`<div .foo=${x}></div>`;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 'foo');
        }
      },
      {
        args: ['foo2'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 'foo2');
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts a string (reflected)': {
    render(x: any) {
      return html`<div .className=${x}></div>`;
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        }
      },
      {
        args: ['foo2'],
        html: '<div class="foo2"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual(dom.querySelector('div')!.className, 'foo2');
        }
      }
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts a number': {
    render(x: any) {
      return html`<div .foo=${x}></div>`;
    },
    expectations: [
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 1);
        }
      },
      {
        args: [2],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 2);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts a number (reflected)': {
    render(x: any) {
      return html`<div .className=${x}></div>`;
    },
    expectations: [
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        }
      },
      {
        args: [2],
        html: '<div class="2"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '2');
        }
      }
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts a boolean': {
    render(x: any) {
      return html`<div .foo=${x}></div>`;
    },
    expectations: [
      {
        args: [false],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, false);
        }
      },
      {
        args: [true],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, true);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts a boolean (reflected)': {
    render(x: any) {
      return html`<div .className=${x}></div>`;
    },
    expectations: [
      {
        args: [false],
        html: '<div class="false"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'false');
        }
      },
      {
        args: [true],
        html: '<div class="true"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'true');
        }
      }
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts undefined': {
    render(x: any) {
      return html`<div .foo=${x}></div>`;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, undefined);
        }
      },
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 1);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts undefined (reflected)': {
    render(x: any) {
      return html`<div .className=${x}></div>`;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div class="undefined"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'undefined');
        }
      },
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        }
      }
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts null': {
    render(x: any) {
      return html`<div .foo=${x}></div>`;
    },
    expectations: [
      {
        args: [null],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, null);
        }
      },
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 1);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts null (reflected)': {
    render(x: any) {
      return html`<div .className=${x}></div>`;
    },
    expectations: [
      {
        args: [null],
        html: '<div class="null"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'null');
        }
      },
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        }
      }
    ],
    stableSelectors: ['div'],
    // We set properties during hydration, and natively-reflecting properties
    // will trigger a "mutation" even when set to the same value that was
    // rendered to its attribute
    expectMutationsDuringHydration: true,
  },

  'PropertyPart accepts noChange': {
    render(x: any) {
      return html`<div .foo=${x}></div>`;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Ideally this would be `notProperty`, but this is actually how
          // the client-side works right now, because the committer starts off
          // as dirty
          assert.strictEqual((dom.querySelector('div') as any).foo, undefined);
        }
      },
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 1);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts noChange (reflected)': {
    render(x: any) {
      return html`<div .className=${x}></div>`;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // className will always read as '' when unset
          assert.strictEqual(dom.querySelector('div')!.className, '');
        }
      },
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts nothing': {
    render(x: any) {
      return html`<div .foo=${x}></div>`;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, undefined);
        }
      },
      {
        args: [1],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 1);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts nothing (reflected)': {
    // TODO: the current client-side does nothing special with `nothing`, just
    // passes it on to the property; is that what we want?
    render(x: any) {
      return html`<div .className=${x}></div>`;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // className will always read as '' when unset
          assert.strictEqual(dom.querySelector('div')!.className, '');
        }
      },
      {
        args: [1],
        html: '<div class="1"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '1');
        }
      }
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
      render(x: any) {
        return html`<div .foo=${x}></div>`;
      },
      expectations: [
        {
          args: [testSymbol],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual((dom.querySelector('div') as any).foo, testSymbol);
          }
        },
        {
          args: [1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual((dom.querySelector('div') as any).foo, 1);
          }
        }
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts an object': () => {
    const testObject = {};
    return  {
      render(x: any) {
        return html`<div .foo=${x}></div>`;
      },
      expectations: [
        {
          args: [testObject],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual((dom.querySelector('div') as any).foo, testObject);
          }
        },
        {
          args: [1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual((dom.querySelector('div') as any).foo, 1);
          }
        }
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts an object (reflected)': () => {
    const testObject = {};
    return  {
      render(x: any) {
        return html`<div .className=${x}></div>`;
      },
      expectations: [
        {
          args: [testObject],
          html: '<div class="[object Object]"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '[object Object]');
          }
        },
        {
          args: [1],
          html: '<div class="1"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '1');
          }
        }
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
    const testArray = [1,2,3];
    return {
      render(x: any) {
        return html`<div .foo=${x}></div>`;
      },
      expectations: [
        {
          args: [testArray],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual((dom.querySelector('div') as any).foo, testArray);
          }
        },
        {
          args: [1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual((dom.querySelector('div') as any).foo, 1);
          }
        }
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts an array (reflected)': () => {
    const testArray = [1,2,3];
    return {
      render(x: any) {
        return html`<div .className=${x}></div>`;
      },
      expectations: [
        {
          args: [testArray],
          html: '<div class="1,2,3"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '1,2,3');
          }
        },
        {
          args: [1],
          html: '<div class="1"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '1');
          }
        }
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
      render(x: any) {
        return html`<div .foo=${x}></div>`;
      },
      expectations: [
        {
          args: [testFunction],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual((dom.querySelector('div') as any).foo, testFunction);
          }
        },
        {
          args: [1],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.strictEqual((dom.querySelector('div') as any).foo, 1);
          }
        }
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts a function (reflected)': () => {
    const testFunction = () => 'test function';
    return {
      render(x: any) {
        return html`<div .className=${x}></div>`;
      },
      expectations: [
        {
          args: [testFunction],
          html: `<div class="() => 'test function'"></div>`,
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, `() => 'test function'`);
          }
        },
        {
          args: [1],
          html: '<div class="1"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, '1');
          }
        }
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

  'PropertyPart accepts directive: guard': () => {
    let guardedCallCount = 0;
    const guardedValue = (bool: boolean) => {
      guardedCallCount++;
      return bool;
    }
    return {
      render(bool: boolean) {
        return html`<div .prop="${guard([bool], () => guardedValue(bool))}"></div>`
      },
      expectations: [
        {
          args: [true],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            assert.strictEqual((dom.querySelector('div') as any).prop, true);
          }
        },
        {
          args: [true],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            assert.strictEqual((dom.querySelector('div') as any).prop, true);
          }
        },
        {
          args: [false],
          html: '<div></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 2);
            assert.strictEqual((dom.querySelector('div') as any).prop, false);
          }
        }
      ],
      stableSelectors: ['div'],
    };
  },

  'PropertyPart accepts directive: guard (reflected)': () => {
    let guardedCallCount = 0;
    const guardedValue = (v: string) => {
      guardedCallCount++;
      return v;
    }
    return {
      render(v: string) {
        return html`<div .className="${guard([v], () => guardedValue(v))}"></div>`
      },
      expectations: [
        {
          args: ['foo'],
          html: '<div class="foo"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, 'foo');
          }
        },
        {
          args: ['foo'],
          html: '<div class="foo"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, 'foo');
          }
        },
        {
          args: ['bar'],
          html: '<div class="bar"></div>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 2);
            // Note className coerces to string
            assert.strictEqual(dom.querySelector('div')!.className, 'bar');
          }
        }
      ],
      stableSelectors: ['div'],
      // We set properties during hydration, and natively-reflecting properties
      // will trigger a "mutation" even when set to the same value that was
      // rendered to its attribute
      expectMutationsDuringHydration: true,
    };
  },

  // 'PropertyPart accepts directive: until (primitive)': {
  //   render(...args) {
  //     return html`<div .prop="${until(...args)}"></div>`
  //   },
  //   expectations: [
  //     {
  //       args: ['foo'],
  //       html: '<div></div>',
  //       check(assert: Chai.Assert, dom: HTMLElement) {
  //         assert.strictEqual((dom.querySelector('div') as any).prop, 'foo');
  //       }
  //     },
  //     {
  //       args: ['bar'],
  //       html: '<div></div>',
  //       check(assert: Chai.Assert, dom: HTMLElement) {
  //         assert.strictEqual((dom.querySelector('div') as any).prop, 'bar');
  //       }
  //     },
  //   ],
  //   stableSelectors: ['div'],
  //   // until always calls setValue each render, with no dirty-check of previous
  //   // value
  //   expectMutationsOnFirstRender: true,
  // },

  // 'PropertyPart accepts directive: until (primitive) (reflected)': {
  //   render(...args) {
  //     return html`<div .className="${until(...args)}"></div>`
  //   },
  //   expectations: [
  //     {
  //       args: ['foo'],
  //       html: '<div class="foo"></div>',
  //       check(assert: Chai.Assert, dom: HTMLElement) {
  //         // Note className coerces to string
  //         assert.strictEqual(dom.querySelector('div')!.className, 'foo');
  //       }
  //     },
  //     {
  //       args: ['bar'],
  //       html: '<div class="bar"></div>',
  //       check(assert: Chai.Assert, dom: HTMLElement) {
  //         // Note className coerces to string
  //         assert.strictEqual(dom.querySelector('div')!.className, 'bar');
  //       }
  //     },
  //   ],
  //   stableSelectors: ['div'],
  //   // We set properties during hydration, and natively-reflecting properties
  //   // will trigger a "mutation" even when set to the same value that was
  //   // rendered to its attribute
  //   expectMutationsDuringHydration: true,
  //   // until always calls setValue each render, with no dirty-check of previous
  //   // value
  //   expectMutationsOnFirstRender: true,
  // },

  // 'PropertyPart accepts directive: until (promise, primitive)': () => {
  //   let resolve: (v: string) => void;
  //   const promise = new Promise(r => resolve = r);
  //   return {
  //     render(...args) {
  //       return html`<div .prop="${until(...args)}"></div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise, 'foo'],
  //         html: '<div></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           assert.strictEqual((dom.querySelector('div') as any).prop, 'foo');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve('promise');
  //           await promise;
  //         },
  //         args: [promise, 'foo'],
  //         html: '<div></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           assert.strictEqual((dom.querySelector('div') as any).prop, 'promise');
  //         }
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //     // until always calls setValue each render, with no dirty-check of previous
  //     // value
  //     expectMutationsOnFirstRender: true,
  //   };
  // },

  // 'PropertyPart accepts directive: until (promise, primitive) (reflected)': () => {
  //   let resolve: (v: string) => void;
  //   const promise = new Promise(r => resolve = r);
  //   return {
  //     render(...args) {
  //       return html`<div .className="${until(...args)}"></div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise, 'foo'],
  //         html: '<div class="foo"></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           // Note className coerces to string
  //           assert.strictEqual(dom.querySelector('div')!.className, 'foo');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve('promise');
  //           await promise;
  //         },
  //         args: [promise, 'foo'],
  //         html: '<div class="promise"></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           // Note className coerces to string
  //           assert.strictEqual(dom.querySelector('div')!.className, 'promise');
  //         }
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //     // We set properties during hydration, and natively-reflecting properties
  //     // will trigger a "mutation" even when set to the same value that was
  //     // rendered to its attribute
  //     expectMutationsDuringHydration: true,
  //     // until always calls setValue each render, with no dirty-check of previous
  //     // value
  //     expectMutationsOnFirstRender: true,
  //   };
  // },

  // 'PropertyPart accepts directive: until (promise, promise)': () => {
  //   let resolve1: (v: string) => void;
  //   let resolve2: (v: string) => void;
  //   const promise1 = new Promise(r => resolve1 = r);
  //   const promise2 = new Promise(r => resolve2 = r);
  //   return {
  //     render(...args) {
  //       return html`<div .prop="${until(...args)}"></div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise2, promise1],
  //         html: '<div></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           assert.notProperty((dom.querySelector('div') as any), 'prop');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve1('promise1');
  //           await promise1;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           assert.strictEqual((dom.querySelector('div') as any).prop, 'promise1');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve2('promise2');
  //           await promise2;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           assert.strictEqual((dom.querySelector('div') as any).prop, 'promise2');
  //         }
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //   }
  // },

  // 'PropertyPart accepts directive: until (promise, promise) (reflected)': () => {
  //   let resolve1: (v: string) => void;
  //   let resolve2: (v: string) => void;
  //   const promise1 = new Promise(r => resolve1 = r);
  //   const promise2 = new Promise(r => resolve2 = r);
  //   return {
  //     render(...args) {
  //       return html`<div .className="${until(...args)}"></div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise2, promise1],
  //         html: '<div></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           // Note className coerces to string
  //           assert.strictEqual(dom.querySelector('div')!.className, '');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve1('promise1');
  //           await promise1;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div class="promise1"></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           // Note className coerces to string
  //           assert.strictEqual(dom.querySelector('div')!.className, 'promise1');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve2('promise2');
  //           await promise2;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div class="promise2"></div>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           // Note className coerces to string
  //           assert.strictEqual(dom.querySelector('div')!.className, 'promise2');
  //         }
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //   }
  // },

  'PropertyPart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html`<div .prop="${ifDefined(v)}"></div>`
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.notProperty((dom.querySelector('div') as any), 'prop');
        }
      },
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).prop, 'foo');
        }
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts directive: ifDefined (undefined) (reflected)': {
    render(v) {
      return html`<div .className="${ifDefined(v)}"></div>`
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, '');
        }
      },
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        }
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts directive: ifDefined (defined)': {
    render(v) {
      return html`<div .prop="${ifDefined(v)}"></div>`
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).prop, 'foo');
        }
      },
      {
        args: [undefined],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).prop, undefined);
        }
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts directive: ifDefined (defined) (reflected)': {
    render(v) {
      return html`<div .className="${ifDefined(v)}"></div>`
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        }
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
        }
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
      return html`<div .prop="${live(v)}"></div>`
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).prop, 'foo');
        }
      },
      {
        args: ['bar'],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).prop, 'bar');
        }
      },
    ],
    stableSelectors: ['div'],
  },

  'PropertyPart accepts directive: live (reflected)': {
    render(v: string) {
      return html`<div .className="${live(v)}"></div>`
    },
    expectations: [
      {
        args: ['foo'],
        html: '<div class="foo"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'foo');
        }
      },
      {
        args: ['bar'],
        html: '<div class="bar"></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          // Note className coerces to string
          assert.strictEqual(dom.querySelector('div')!.className, 'bar');
        }
      },
    ],
    stableSelectors: ['div'],
  },

  'multiple PropertyParts on same node': {
    render(x: any, y: any) {
      return html`<div .foo=${x} .bar=${y}></div>`;
    },
    expectations: [
      {
        args: [1, true],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 1);
          assert.strictEqual((dom.querySelector('div') as any).bar, true);
        }
      },
      {
        args: [2, false],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, 2);
          assert.strictEqual((dom.querySelector('div') as any).bar, false);
        }
      }
    ],
    stableSelectors: ['div'],
  },

  'multiple PropertyParts in one property': {
    render(x: any, y: any) {
      return html`<div .foo="${x},${y}"></div>`;
    },
    expectations: [
      {
        args: [1, true],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, '1,true');
        }
      },
      {
        args: [2, false],
        html: '<div></div>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.strictEqual((dom.querySelector('div') as any).foo, '2,false');
        }
      }
    ],
    stableSelectors: ['div'],
  },

  /******************************************************
   * EventPart tests
   ******************************************************/

  'EventPart': {
    render(listener: (e: Event) => void) {
      return html`<button @click=${listener}>X</button>`;
    },
    expectations: [
      {
        args: [(e: Event) => (e.target as any).__wasClicked = true],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const button = dom.querySelector('button')!;
          button.click();
          assert.strictEqual((button as any).__wasClicked, true, 'not clicked during first render');
        }
      },
      {
        args: [(e: Event) => (e.target as any).__wasClicked2 = true],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const button = dom.querySelector('button')!;
          button.click();
          assert.strictEqual((button as any).__wasClicked2, true, 'not clicked during second render');
        }
      }
    ],
    stableSelectors: ['button'],
  },

  'EventPart accepts directive: guard': () => {
    const listener1 = (e: Event) => (e.target as any).__wasClicked1 = true;
    const listener2 = (e: Event) => (e.target as any).__wasClicked2 = true;
    let guardedCallCount = 0;
    const guardedValue = (fn: (e: Event) => any) => {
      guardedCallCount++;
      return fn;
    }
    return {
      render(fn: (e: Event) => any) {
        return html`<button @click="${guard([fn], () => guardedValue(fn))}">X</button>`
      },
      expectations: [
        {
          args: [listener1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual((button as any).__wasClicked1, true, 'not clicked during first render');
          }
        },
        {
          args: [listener1],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 1);
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual((button as any).__wasClicked1, true, 'not clicked during second render');
          }
        },
        {
          args: [listener2],
          html: '<button>X</button>',
          check(assert: Chai.Assert, dom: HTMLElement) {
            assert.equal(guardedCallCount, 2);
            const button = dom.querySelector('button')!;
            button.click();
            assert.strictEqual((button as any).__wasClicked2, true, 'not clicked during third render');
          }
        }
      ],
      stableSelectors: ['button'],
    };
  },

  // 'EventPart accepts directive: until (listener)': () => {
  //   const listener1 = (e: Event) => (e.target as any).__wasClicked1 = true;
  //   const listener2 = (e: Event) => (e.target as any).__wasClicked2 = true;
  //   return {
  //     render(...args) {
  //       return html`<button @click="${until(...args)}">X</button>`
  //     },
  //     expectations: [
  //       {
  //         args: [listener1],
  //         html: '<button>X</button>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           const button = dom.querySelector('button')!;
  //           button.click();
  //           assert.strictEqual((button as any).__wasClicked1, true, 'not clicked during first render');
  //         }
  //       },
  //       {
  //         args: [listener2],
  //         html: '<button>X</button>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           const button = dom.querySelector('button')!;
  //           button.click();
  //           assert.strictEqual((button as any).__wasClicked2, true, 'not clicked during second render');
  //         }
  //       },
  //     ],
  //     stableSelectors: ['button'],
  //   };
  // },

  // 'EventPart accepts directive: until (promise, listener)': () => {
  //   const listener1 = (e: Event) => (e.target as any).__wasClicked1 = true;
  //   const listener2 = (e: Event) => (e.target as any).__wasClicked2 = true;
  //   let resolve: (v: (e: Event) => any) => void;
  //   const promise = new Promise(r => resolve = r);
  //   return {
  //     render(...args) {
  //       return html`<button @click="${until(...args)}">X</button>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise, listener1],
  //         html: '<button>X</button>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           const button = dom.querySelector('button')!;
  //           button.click();
  //           assert.strictEqual((button as any).__wasClicked1, true, 'not clicked during first render');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve(listener2);
  //           await promise;
  //         },
  //         args: [promise, listener1],
  //         html: '<button>X</button>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           const button = dom.querySelector('button')!;
  //           button.click();
  //           assert.strictEqual((button as any).__wasClicked2, true, 'not clicked during second render');
  //         }
  //       },
  //     ],
  //     stableSelectors: ['button'],
  //   };
  // },
  //
  // 'EventPart accepts directive: until (promise, promise)': () => {
  //   const listener1 = (e: Event) => (e.target as any).__wasClicked1 = true;
  //   const listener2 = (e: Event) => (e.target as any).__wasClicked2 = true;
  //   let resolve1: (v: (e: Event) => any) => void;
  //   let resolve2: (v: (e: Event) => any) => void;
  //   const promise1 = new Promise(r => resolve1 = r);
  //   const promise2 = new Promise(r => resolve2 = r);
  //   return {
  //     render(...args) {
  //       return html`<button @click="${until(...args)}">X</button>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise2, promise1],
  //         html: '<button>X</button>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           assert.notProperty((dom.querySelector('button') as any), 'prop');
  //           const button = dom.querySelector('button')!;
  //           button.click();
  //           assert.notProperty(button, '__wasClicked1', 'was clicked during first render');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve1(listener1);
  //           await promise1;
  //         },
  //         args: [promise2, promise1],
  //         html: '<button>X</button>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           const button = dom.querySelector('button')!;
  //           button.click();
  //           assert.strictEqual((button as any).__wasClicked1, true, 'not clicked during second render');
  //         }
  //       },
  //       {
  //         async setup() {
  //           resolve2(listener2);
  //           await promise2;
  //         },
  //         args: [promise2, promise1],
  //         html: '<button>X</button>',
  //         check(assert: Chai.Assert, dom: HTMLElement) {
  //           const button = dom.querySelector('button')!;
  //           button.click();
  //           assert.strictEqual((button as any).__wasClicked2, true, 'not clicked during third render');
  //         }
  //       },
  //     ],
  //     stableSelectors: ['button'],
  //   }
  // },

  'EventPart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html`<button @click="${ifDefined(v)}">X</button>`
    },
    expectations: [
      {
        args: [undefined],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.notProperty((dom.querySelector('button') as any), 'prop');
          const button = dom.querySelector('button')!;
          button.click();
          assert.notProperty(button, '__wasClicked1', 'was clicked during first render');
        }
      },
      {
        args: [(e: Event) => (e.target as any).__wasClicked = true],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const button = dom.querySelector('button')!;
          button.click();
          assert.strictEqual((button as any).__wasClicked, true, 'not clicked during second render');
        }
      },
    ],
    stableSelectors: ['button'],
  },

  'EventPart accepts directive: ifDefined (defined)': {
    render(v) {
      return html`<button @click="${ifDefined(v)}">X</button>`
    },
    expectations: [
      {
        args: [(e: Event) => (e.target as any).__wasClicked = true],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          const button = dom.querySelector('button')!;
          button.click();
          assert.strictEqual((button as any).__wasClicked, true, 'not clicked during second render');
        }
      },
      {
        args: [undefined],
        html: '<button>X</button>',
        check(assert: Chai.Assert, dom: HTMLElement) {
          assert.notProperty((dom.querySelector('button') as any), 'prop');
          const button = dom.querySelector('button')!;
          button.click();
          assert.notProperty(button, '__wasClicked1', 'was clicked during first render');
        }
      },
    ],
    stableSelectors: ['button'],
  },

  /******************************************************
   * BooleanAttributePart tests
   ******************************************************/

  'BooleanAttributePart, initially true': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [true],
        html: '<div hidden></div>',
      },
      {
        args: [false],
        html: '<div></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially truthy (number)': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [1],
        html: '<div hidden></div>',
      },
      {
        args: [false],
        html: '<div></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially truthy (object)': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [{}],
        html: '<div hidden></div>',
      },
      {
        args: [false],
        html: '<div></div>',
      }
    ],
    stableSelectors: ['div'],
    // Objects never dirty-check, so they cause a setAttribute despite being hydrated
    expectMutationsOnFirstRender: true,
  },

  'BooleanAttributePart, initially false': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [false],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially falsey (number)': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [0],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially falsey (null)': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [null],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially falsey (undefined)': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [undefined],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially nothing': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [nothing],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart, initially noChange': {
    render(hide: boolean) {
      return html`<div ?hidden=${hide}></div>`;
    },
    expectations: [
      {
        args: [noChange],
        html: '<div></div>',
      },
      {
        args: [true],
        html: '<div hidden></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'BooleanAttributePart accepts directive: guard': () => {
    let guardedCallCount = 0;
    const guardedValue = (bool: boolean) => {
      guardedCallCount++;
      return bool;
    }
    return {
      render(bool: boolean) {
        return html`<div ?hidden="${guard([bool], () => guardedValue(bool))}"></div>`
      },
      expectations: [
        {
          args: [true],
          html: '<div hidden></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          }
        },
        {
          args: [true],
          html: '<div hidden></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 1);
          }
        },
        {
          args: [false],
          html: '<div></div>',
          check(assert: Chai.Assert) {
            assert.equal(guardedCallCount, 2);
          }
        }
      ],
      stableSelectors: ['div'],
    };
  },

  // 'BooleanAttributePart accepts directive: until (primitive)': {
  //   render(...args) {
  //     return html`<div ?hidden="${until(...args)}"></div>`
  //   },
  //   expectations: [
  //     {
  //       args: [true],
  //       html: '<div hidden></div>',
  //     },
  //     {
  //       args: [false],
  //       html: '<div></div>',
  //     },
  //   ],
  //   stableSelectors: ['div'],
  //   // until always calls setValue each render, with no dirty-check of previous
  //   // value
  //   expectMutationsOnFirstRender: true,
  // },

  // 'BooleanAttributePart accepts directive: until (promise, primitive)': () => {
  //   let resolve: (v: boolean) => void;
  //   const promise = new Promise(r => resolve = r);
  //   return {
  //     render(...args) {
  //       return html`<div ?hidden="${until(...args)}"></div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise, true],
  //         html: '<div hidden></div>',
  //       },
  //       {
  //         async setup() {
  //           resolve(false);
  //           await promise;
  //         },
  //         args: [promise, true],
  //         html: '<div></div>',
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //     // until always calls setValue each render, with no dirty-check of previous
  //     // value
  //     expectMutationsOnFirstRender: true,
  //   };
  // },

  // 'BooleanAttributePart accepts directive: until (promise, promise)': () => {
  //   let resolve1: (v: boolean) => void;
  //   let resolve2: (v: boolean) => void;
  //   const promise1 = new Promise(r => resolve1 = r);
  //   const promise2 = new Promise(r => resolve2 = r);
  //   return {
  //     render(...args) {
  //       return html`<div ?hidden="${until(...args)}"></div>`
  //     },
  //     expectations: [
  //       {
  //         args: [promise2, promise1],
  //         html: '<div></div>',
  //       },
  //       {
  //         async setup() {
  //           resolve1(true);
  //           await promise1;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div hidden></div>',
  //       },
  //       {
  //         async setup() {
  //           resolve2(false);
  //           await promise2;
  //         },
  //         args: [promise2, promise1],
  //         html: '<div></div>',
  //       },
  //     ],
  //     stableSelectors: ['div'],
  //   }
  // },

  'BooleanAttributePart accepts directive: ifDefined (undefined)': {
    render(v) {
      return html`<div ?hidden="${ifDefined(v)}"></div>`
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
      return html`<div ?hidden="${ifDefined(v)}"></div>`
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
      return html`<div ?hidden="${live(v)}"></div>`
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

  /******************************************************
   * Mixed part tests
   ******************************************************/

  'NodeParts & AttributeParts on adjacent nodes': {
    render(x, y) {
      return html`<div attr="${x}">${x}</div><div attr="${y}">${y}</div>`;
    },
    expectations: [
      {
        args: ['x', 'y'],
        html: '<div attr="x">x</div><div attr="y">y</div>',
      },
      {
        args: ['a', 'b'],
        html: '<div attr="a">a</div><div attr="b">b</div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'NodeParts & AttributeParts on nested nodes': {
    render(x, y) {
      return html`<div attr="${x}">${x}<div attr="${y}">${y}</div></div>`;
    },
    expectations: [
      {
        args: ['x', 'y'],
        html: '<div attr="x">x<div attr="y">y</div></div>',
      },
      {
        args: ['a', 'b'],
        html: '<div attr="a">a<div attr="b">b</div></div>',
      }
    ],
    stableSelectors: ['div'],
  },

  'NodeParts & AttributeParts soup': {
    render(x, y, z) {
      return html`text:${x}<div>${x}</div><span a1="${y}" a2="${y}">${x}<p a="${y}">${y}</p>${z}</span>`;
    },
    expectations: [
      {
        args: [html`<a></a>`, 'b', 'c'],
        html: 'text:\n<a></a><div><a></a></div><span a1="b" a2="b"><a></a><p a="b">b</p>c</span>',
      },
      {
        args: ['x', 'y', html`<i></i>`],
        html: 'text:x\n<div>x</div><span a1="y" a2="y">x<p a="y">y</p><i></i></span>',
      }
    ],
    stableSelectors: ['div', 'span', 'p'],
  },

  'All part types with at various depths': () => {
    const handler1 = (e: Event) => (e.target as any).triggered1 = true;
    const handler2 = (e: Event) => (e.target as any).triggered2 = true;
    const checkDiv = (assert: Chai.Assert, dom: HTMLElement, id: string, x: any, triggerProp: string) => {
      const div = dom.querySelector(`#${id}`) as HTMLElement;
      assert.ok(div, `Div ${id} not found`);
      div.click();
      assert.equal((div as any)[triggerProp], true, `Event not triggered for ${id}`);
      assert.equal((div as any).p, x, `Property not set for ${id}`);
    };
    const dir = directive(class extends Directive {
      value: string | undefined;
      render(value: string) {
        if (this.value !== value) {
          this.value = value;
          return value ? `[${value}]` : value;
        }
        return noChange;
      }
    });
    const check = (assert: Chai.Assert, dom: HTMLElement, x: any, triggerProp: string) => {
      for (let i=0; i<2; i++) {
        checkDiv(assert, dom, `div${i}`, x, triggerProp);
        for (let j=0; j<2; j++) {
          checkDiv(assert, dom, `div${i}-${j}`, x, triggerProp);
          for (let k=0; k<3; k++) {
            checkDiv(assert, dom, `div${i}-${j}-${k}`, x, triggerProp);
          }
        }
      }
    };
    return {
      render(x, y, z, h) {
        return html`
          <div id="div0" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
            ${x}
            <div id="div0-0" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
              ${y}
              <div id="div0-0-0" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
              <div id="div0-0-1" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
              <span>static</span>
              <div id="div0-0-2" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
            </div>
            <span>static</span>
            <span>static</span>
            <div id="div0-1" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
              ${y}
              <div id="div0-1-0" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
              <div id="div0-1-1" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
              <span>static</span>
              <div id="div0-1-2" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
            </div>
          </div>
          <div id="div1" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
            ${x}
            <div id="div1-0" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
              ${y}
              <div id="div1-0-0" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
              <div id="div1-0-1" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
              <span>static</span>
              <div id="div1-0-2" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
            </div>
            <span>static</span>
            <span>static</span>
            <div id="div1-1" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
              ${y}
              <div id="div1-1-0" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
              <div id="div1-1-1" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
              <span>static</span>
              <div id="div1-1-2" a1=${x} a2="[${x}-${y}]" a3="(${dir(x)})" .p=${x} @click=${h} ?b=${x}>
                ${z}
              </div>
            </div>
          </div>
        `;
      },
      expectations: [
        {
          args: ['x', 'y', html`<a>z</a>`, handler1],
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
          }
        },
        {
          args: [0, 1, html`<b>2</b>`, handler2],
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
          }
        },
      ],
      stableSelectors: ['div', 'span'],
    }
  },

  /******************************************************
   * LitElement tests
   ******************************************************/

  'LitElement: Basic': () => {
    return {
      registerElements() {
        customElements.define('le-basic', class extends LitElement {
          render() {
            return html` <div>[le-basic: <slot></slot>]</div>`;
          }
        });
      },
      render(x: string) {
        return html`<le-basic>${x}</le-basic>`;
      },
      expectations: [
        {
          args: ['x'],
          html: {
            root: `<le-basic>x</le-basic>`,
            'le-basic': `<div>[le-basic: <slot></slot>]</div>`
          },
        },
      ],
      stableSelectors: ['le-basic'],
    };
  },

  'LitElement: Nested': () => {
    return {
      registerElements() {
        customElements.define('le-nested1', class extends LitElement {
          render() {
            return html` <div>[le-nested1: <le-nested2><slot></slot></le-nested2>]</div>`;
          }
        });
        customElements.define('le-nested2', class extends LitElement {
          render() {
            return html` <div>[le-nested2: <slot></slot>]</div>`;
          }
        });
      },
      render(x: string) {
        return html`<le-nested1>${x}</le-nested1>`;
      },
      expectations: [
        {
          args: ['x'],
          html: {
            root: `<le-nested1>x</le-nested1>`,
            'le-nested1': {
              root: `<div>[le-nested1: <le-nested2><slot></slot></le-nested2>]</div>`,
              'le-nested2': `<div>[le-nested2: <slot></slot>]</div>`
            }
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
          render() {
            return html` <div>[${this.prop}]</div>`;
          }
        }
        customElements.define('le-prop-binding', LEPropBinding);
      },
      render(prop: any) {
        return html`<le-prop-binding .prop=${prop}></le-prop-binding>`;
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
            'le-prop-binding': `<div>\n  [boundProp1]\n</div>`
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
            'le-prop-binding': `<div>\n  [boundProp2]\n</div>`
          },
        },
      ],
      stableSelectors: ['le-prop-binding'],
    };
  },

  'LitElement: Reflected property binding': () => {
    return {
      registerElements() {
        class LEReflectedBinding extends LitElement {
          @property({reflect: true})
          prop = 'default';
          render() {
            return html` <div>[${this.prop}]</div>`;
          }
        }
        customElements.define('le-reflected-binding', LEReflectedBinding);
      },
      render(prop: any) {
        return html`<le-reflected-binding .prop=${prop}></le-reflected-binding>`;
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
            'le-reflected-binding': `<div>\n  [boundProp1]\n</div>`
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
            'le-reflected-binding': `<div>\n  [boundProp2]\n</div>`
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
          render() {
            return html` <div>[${this.prop}]</div>`;
          }
        }
        customElements.define('le-attr-binding', LEAttrBinding);
      },
      render(prop: any) {
        return html`<le-attr-binding prop=${prop}></le-attr-binding>`;
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
            root: `<le-attr-binding prop="boundProp1"></le-attr-binding>`,
            'le-attr-binding': `<div>\n  [boundProp1]\n</div>`
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
            root: `<le-attr-binding prop="boundProp2"></le-attr-binding>`,
            'le-attr-binding': `<div>\n  [boundProp2]\n</div>`
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
          template: any = 'default';
          render() {
            return html` <div>${this.template}</div>`;
          }
        }
        customElements.define('le-node-binding', LENodeBinding);
      },
      render(template: (s: string) => any) {
        return html`<le-node-binding .template=${template('shadow')}>${template('light')}</le-node-binding>`;
      },
      expectations: [
        {
          args: [(s: string) => html`[template1: ${s}]`],
          async check(_assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-node-binding')! as LitElement;
            await el.updateComplete;
          },
          html: {
            root: `<le-node-binding>\n  [template1: light]\n</le-node-binding>`,
            'le-node-binding': `<div>\n  [template1: shadow]\n</div>`
          },
        },
        {
          args: [(s: string) => html`[template2: ${s}]`],
          async check(_assert: Chai.Assert, dom: HTMLElement) {
            const el = dom.querySelector('le-node-binding')! as LitElement;
            await el.updateComplete;
          },
          html: {
            root: `<le-node-binding>\n  [template2: light]\n</le-node-binding>`,
            'le-node-binding': `<div>\n  [template2: shadow]\n</div>`
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
          render() {
            return html` <div>[shadow:${this.prop}<slot></slot>]</div>`;
          }
          renderLight() {
            return html` <div>[light:${this.prop}]</div>`;
          }
        }
        customElements.define('le-render-light', LERenderLight);
      },
      render(prop: any) {
        return html`<le-render-light .prop=${prop}>${renderLight()}</le-render-light>`;
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
            'le-render-light': `<div>\n  [shadow:boundProp1\n  <slot></slot>\n  ]\n</div>`
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
            'le-render-light': `<div>\n  [shadow:boundProp2\n  <slot></slot>\n  ]\n</div>`
          },
        },
      ],
      stableSelectors: ['le-render-light'],
    };
  },

};