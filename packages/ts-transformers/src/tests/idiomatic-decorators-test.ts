/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
import {compileTsFragment, CompilerHostCache} from './compile-ts-fragment.js';
import ts from 'typescript';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import prettier from 'prettier';
import {idiomaticDecoratorsTransformer} from '../idiomatic-decorators.js';
import {
  preserveBlankLinesTransformer,
  BLANK_LINE_PLACEHOLDER_COMMENT_REGEXP,
} from '../preserve-blank-lines.js';
import {constructorCleanupTransformer} from '../constructor-cleanup.js';

import type * as uvu from 'uvu';

const cache = new CompilerHostCache();

/**
 * Compile the given fragment of TypeScript source code using the idiomatic
 * decorator transform. Check that there are no errors and that the output
 * matches (prettier-formatted).
 */
function checkTransform(
  inputTs: string,
  expectedJs: string,
  options: ts.CompilerOptions
) {
  // Don't automatically load typings from nodes_modules/@types, we're not using
  // them here, so it's a waste of time.
  options.typeRoots = [];
  options.experimentalDecorators = true;
  const result = compileTsFragment(
    inputTs,
    __dirname,
    options,
    cache,
    (program) => ({
      before: [
        preserveBlankLinesTransformer(),
        idiomaticDecoratorsTransformer(program),
      ],
      after: [constructorCleanupTransformer(program)],
    })
  );

  assert.equal(
    result.diagnostics.map((diagnostic) =>
      ts.formatDiagnostic(diagnostic, result.host)
    ),
    []
  );

  let formattedExpected = prettier.format(expectedJs, {parser: 'typescript'});
  // TypeScript >= 4 will add an empty export statement if there are no imports
  // or exports to ensure this is a module. We don't care about checking this.
  const unformattedActual = (result.code || '')
    .replace('export {};', '')
    .replace(BLANK_LINE_PLACEHOLDER_COMMENT_REGEXP, '\n');
  let formattedActual;
  try {
    formattedActual = prettier.format(unformattedActual, {
      parser: 'typescript',
    });
  } catch {
    // We might emit invalid TypeScript in a failing test. Rather than fail with
    // a Prettier parse exception, it's more useful to see a diff.
    formattedExpected = expectedJs;
    formattedActual = unformattedActual;
  }
  assert.is(formattedActual, formattedExpected, formattedActual);
}

const tests = (test: uvu.Test<uvu.Context>, options: ts.CompilerOptions) => {
  test('@customElement', () => {
    const input = `
    import {LitElement} from 'lit';
    import {customElement} from 'lit/decorators.js';

    /**
     * My class.
     */
    @customElement('my-element')
    class MyElement extends LitElement {
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    /**
     * My class.
     */
    class MyElement extends LitElement {
    }
    customElements.define('my-element', MyElement);
    `;
    checkTransform(input, expected, options);
  });

  test('@property (no existing constructor)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property} from 'lit/decorators.js';

    class MyElement extends LitElement {
      /**
       * Property description.
       */
      @property()
      reactiveInitializedStr = "foo";

      nonReactiveInitialized = 123;

      @property({type: Object})
      reactiveUninitializedObj;

      @property({type: Number, attribute: false})
      reactiveInitializedNum = 42;

      nonReactiveUninitialized: string;

      @property({type: Boolean, reflect: true})
      reactiveInitializedBool = false;

      /**
       * Reactive getter description.
       */
      @property({type: Boolean})
      get reactiveGetter() {
        return false;
      }

      @property({type: Boolean})
      get reactiveGetterNoComment() {
        return false;
      }
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        static properties = {
          reactiveInitializedStr: {},
          reactiveUninitializedObj: {type: Object},
          reactiveInitializedNum: {type: Number, attribute: false},
          reactiveInitializedBool: {type: Boolean, reflect: true},
          reactiveGetter: {type: Boolean},
          reactiveGetterNoComment: {type: Boolean},
        };

        constructor() {
          super();
          /**
           * Property description.
           */
          this.reactiveInitializedStr = "foo";
          this.reactiveInitializedNum = 42;
          this.reactiveInitializedBool = false;
      }

        nonReactiveInitialized = 123;

        nonReactiveUninitialized;

        /**
         * Reactive getter description.
         */
        get reactiveGetter() {
          return false;
        }

        get reactiveGetterNoComment() {
          return false;
        }
      }
      `;
    } else {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        constructor() {
          super();

          this.nonReactiveInitialized = 123;
          /**
           * Property description.
           */
          this.reactiveInitializedStr = "foo";
          this.reactiveInitializedNum = 42;
          this.reactiveInitializedBool = false;
        }

        /**
         * Reactive getter description.
         */
        get reactiveGetter() {
          return false;
        }

        get reactiveGetterNoComment() {
          return false;
        }
      }
      MyElement.properties = {
        reactiveInitializedStr: {},
        reactiveUninitializedObj: {type: Object},
        reactiveInitializedNum: {type: Number, attribute: false},
        reactiveInitializedBool: {type: Boolean, reflect: true},
        reactiveGetter: {type: Boolean},
        reactiveGetterNoComment: {type: Boolean},
      };
      `;
    }
    checkTransform(input, expected, options);
  });

  test('@property (existing constructor)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property} from 'lit/decorators.js';

    class MyElement extends LitElement {
      @property()
      reactiveInitializedStr = "foo";

      nonReactiveInitialized = 123;

      @property({type: Object})
      reactiveUninitializedObj;

      @property({type: Number, attribute: false})
      reactiveInitializedNum = 42;

      nonReactiveUninitialized: string;

      @property({type: Boolean, reflect: true})
      reactiveInitializedBool = false;

      /**
       * Reactive getter description.
       */
      @property({type: Boolean})
      get reactiveGetter() {
        return false;
      }

      @property({type: Boolean})
      get reactiveGetterNoComment() {
        return false;
      }

      constructor() {
        super();
      }
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        static properties = {
          reactiveInitializedStr: {},
          reactiveUninitializedObj: {type: Object},
          reactiveInitializedNum: {type: Number, attribute: false},
          reactiveInitializedBool: {type: Boolean, reflect: true},
          reactiveGetter: {type: Boolean},
          reactiveGetterNoComment: {type: Boolean},
        };

        nonReactiveInitialized = 123;

        nonReactiveUninitialized;

        /**
         * Reactive getter description.
         */
        get reactiveGetter() {
          return false;
        }

        get reactiveGetterNoComment() {
          return false;
        }

        constructor() {
          super();
          this.reactiveInitializedStr = "foo";
          this.reactiveInitializedNum = 42;
          this.reactiveInitializedBool = false;
        }
      }
      `;
    } else {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        /**
         * Reactive getter description.
         */
        get reactiveGetter() {
          return false;
        }

        get reactiveGetterNoComment() {
          return false;
        }

        constructor() {
          super();

          this.nonReactiveInitialized = 123;
          this.reactiveInitializedStr = "foo";
          this.reactiveInitializedNum = 42;
          this.reactiveInitializedBool = false;
        }
      }
      MyElement.properties = {
        reactiveInitializedStr: {},
        reactiveUninitializedObj: {type: Object},
        reactiveInitializedNum: {type: Number, attribute: false},
        reactiveInitializedBool: {type: Boolean, reflect: true},
        reactiveGetter: {type: Boolean},
        reactiveGetterNoComment: {type: Boolean},
      };
      `;
    }
    checkTransform(input, expected, options);
  });

  test('@property (do not create constructor if just getter)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property} from 'lit/decorators.js';

    class MyElement extends LitElement {
      @property({type: Boolean})
      get reactiveGetter() {
        return false;
      }
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        static properties = {
          reactiveGetter: {type: Boolean},
        };
        get reactiveGetter() {
          return false;
        }
      }
      `;
    } else {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        get reactiveGetter() {
          return false;
        }
      }
      MyElement.properties = {
        reactiveGetter: {type: Boolean},
      };
      `;
    }
    checkTransform(input, expected, options);
  });

  test('@property (merge with existing static properties field)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property} from 'lit/decorators.js';

    class MyElement extends LitElement {
      unrelated1() {}

      static properties = {
        str: {},
      };

      unrelated2() {}

      @property({type: Number})
      num = 42;

      constructor() {
        super();
      }
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        unrelated1() {}

        static properties = {
          str: {},
          num: {type: Number},
        };

        unrelated2() {}

        constructor() {
          super();
          this.num = 42;
        }
      }
      `;
    } else {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        unrelated1() {}

        unrelated2() {}

        constructor() {
          super();
          this.num = 42;
        }
      }

      MyElement.properties = {
        str: {},
        num: {type: Number},
      };
      `;
    }
    checkTransform(input, expected, options);
  });

  test('@property (merge with existing static properties getter)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property} from 'lit/decorators.js';

    class MyElement extends LitElement {
      unrelated1() {}

      static get properties() {
        return {
          str: {},
        };
      }

      unrelated2() {}

      @property({type: Number})
      num = 42;

      constructor() {
        super();
      }
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      unrelated1() {}

      static get properties() {
        return {
          str: {},
          num: {type: Number},
        };
      }

      unrelated2() {}

      constructor() {
        super();
        this.num = 42;
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@state', () => {
    const input = `
    import {LitElement} from 'lit';
    import {state} from 'lit/decorators.js';

    class MyElement extends LitElement {
      /* num comment */
      @state()
      num = 42;

      // num2 comment
      @state({hasChanged: () => false})
      num2 = 24;
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        static properties = {
          num: {state: true},
          num2: {hasChanged: () => false, state: true},
        };

        constructor() {
          super();
          /* num comment */
          this.num = 42;
          // num2 comment
          this.num2 = 24;
        }
      }
      `;
    } else {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        constructor() {
          super();
          /* num comment */
          this.num = 42;
          // num2 comment
          this.num2 = 24;
        }
      }
      MyElement.properties = {
        num: {state: true},
        num2: {hasChanged: () => false, state: true},
      };
      `;
    }
    checkTransform(input, expected, options);
  });

  test('@query (non-caching)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {query} from 'lit/decorators.js';

    class MyElement extends LitElement {
      unrelated1() {}

      // div comment
      @query('#myDiv')
      div?: HTMLDivElement;

      unrelated2() {}
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      unrelated1() {}

      // div comment
      get div() {
        return this.renderRoot?.querySelector('#myDiv') ?? null;
      }

      unrelated2() {}
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@query (caching)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {query} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // span comment
      @query('#mySpan', true)
      span?: HTMLSpanElement;
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      // span comment
      get span() {
        return this.__span ??= this.renderRoot?.querySelector('#mySpan') ?? null;
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAll', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAll} from 'lit/decorators.js';

    class MyElement extends LitElement {
      unrelated1() {}

      // inputs comment
      @queryAll('.myInput')
      inputs: NodeListOf<HTMLInputElement>;

      unrelated2() {}
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      unrelated1() {}

      // inputs comment
      get inputs() {
        return this.renderRoot?.querySelectorAll('.myInput') ?? [];
      }

      unrelated2() {}
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAsync', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAsync} from 'lit/decorators.js';

    class MyElement extends LitElement {
      unrelated1() {}

      // button comment
      @queryAsync('#myButton')
      button: Promise<HTMLElement>;

      unrelated2() {}
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      unrelated1() {}

      // button comment
      get button() {
        return this.updateComplete.then(
          () => this.renderRoot.querySelector('#myButton'));
      }

      unrelated2() {}
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (default slot)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    class MyElement extends LitElement {
      unrelated1() {}

      // listItems comment
      @queryAssignedElements()
      listItems: NodeListOf<HTMLElement>;

      unrelated2() {}
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      unrelated1() {}

      // listItems comment
      get listItems() {
        return this.renderRoot
        ?.querySelector(\`slot:not([name])\`)
        ?.assignedElements() ?? [];
      }

      unrelated2() {}
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (with slot name)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements({ slot: 'list' })
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=list]\`)
          ?.assignedElements() ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (with flatten)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements({ slot: \`list\`, flatten: true })
      listItems: NodeListOf<HTMLElement>;
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=list]\`)
          ?.assignedElements({flatten: true}) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (with selector)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements({slot: 'list', flatten: false, selector: '.item'})
      listItems: NodeListOf<HTMLElement>;
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=list]\`)
          ?.assignedElements({ flatten: false })
          ?.filter((node) => node.matches('.item')
          ) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (with assignedElements identifier)', () => {
    // It doesn't matter if the HTMLSlotElement.assignedElements options are
    // using an identifer as we don't need to extract them.
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    const isFlatten: boolean = false;

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements({slot: 'list', flatten: isFlatten, selector: '.item'})
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    const isFlatten = false;

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=list]\`)
          ?.assignedElements({ flatten: isFlatten })
          ?.filter((node) => node.matches(".item")
          ) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (with slot and selector identifiers)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    const slot = 'list';
    const selector = '.item';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements({slot: slot, selector: selector})
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    const slot = 'list';
    const selector = '.item';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=\${slot}]\`)
          ?.assignedElements()
          ?.filter((node) => node.matches(selector)
          ) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (shorthand properties)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    const slot = 'list';
    const selector = '.item';
    const flatten: boolean = false;

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements({slot, selector, flatten})
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    const slot = 'list';
    const selector = '.item';
    const flatten = false;

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=\${slot}]\`)
          ?.assignedElements({ flatten })
          ?.filter((node) => node.matches(selector)
          ) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (arbitrary inline expressions)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements({slot: "li" + "st", selector: "." + "item", flatten: true || false})
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=\${"li" + "st"}]\`)
          ?.assignedElements({ flatten: true || false })
          ?.filter((node) => node.matches("." + "item")
          ) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedElements (fails if not object literal)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    const someIdentifier = {slot: 'list'};

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements(someIdentifier)
      listItems: HTMLElement[];
    }
    `;
    assert.throws(
      () => checkTransform(input, '', options),
      /expected to be an inlined object literal/
    );
  });

  test('@queryAssignedElements (fails if not property assignment - spread)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedElements} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedElements({slot: 'list', ...{}})
      listItems: HTMLElement[];
    }
    `;
    assert.throws(
      () => checkTransform(input, '', options),
      /argument can only include property assignment/
    );
  });

  test('@queryAssignedNodes (with slot name)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedNodes({ slot: 'list' })
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=list]\`)
          ?.assignedNodes() ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedNodes (with flatten)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedNodes({ slot: \`list\`, flatten: true })
      listItems: NodeListOf<HTMLElement>;
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=list]\`)
          ?.assignedNodes({flatten: true}) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedNodes (with assignedNodes identifier)', () => {
    // It doesn't matter if the HTMLSlotElement.assignedNodes options are
    // using an identifer as we don't need to extract them.
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    const isFlatten: boolean = false;

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedNodes({slot: 'list', flatten: isFlatten})
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    const isFlatten = false;

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=list]\`)
          ?.assignedNodes({ flatten: isFlatten }) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedNodes (with slot and selector identifiers)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    const slot = 'list';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedNodes({slot: slot})
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    const slot = 'list';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=\${slot}]\`)
          ?.assignedNodes() ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedNodes (shorthand properties)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    const slot = 'list';
    const flatten: boolean = false;

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedNodes({slot, flatten})
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    const slot = 'list';
    const flatten = false;

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=\${slot}]\`)
          ?.assignedNodes({ flatten }) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedNodes (arbitrary inline expressions)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedNodes({slot: "li" + "st", flatten: true || false})
      listItems: HTMLElement[];
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      // listItems comment
      get listItems() {
        return this.renderRoot
          ?.querySelector(\`slot[name=\${"li" + "st"}]\`)
          ?.assignedNodes({ flatten: true || false }) ?? [];
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@queryAssignedNodes (fails if not object literal)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    const someIdentifier = {slot: 'list'};

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedNodes(someIdentifier)
      listItems: HTMLElement[];
    }
    `;
    assert.throws(
      () => checkTransform(input, '', options),
      /expected to be an inlined object literal/
    );
  });

  test('@queryAssignedNodes (fails if not property assignment - spread)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // listItems comment
      @queryAssignedNodes({slot: 'list', ...{}})
      listItems: HTMLElement[];
    }
    `;
    assert.throws(
      () => checkTransform(input, '', options),
      /argument can only include property assignment/
    );
  });

  test('@queryAssignedNodes (default slot)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {queryAssignedNodes} from 'lit/decorators.js';

    class MyElement extends LitElement {
      unrelated1() {}

      // listItems comment
      @queryAssignedNodes()
      listItems: NodeListOf<HTMLElement>;

      unrelated2() {}
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    class MyElement extends LitElement {
      unrelated1() {}

      // listItems comment
      get listItems() {
        return this.renderRoot
        ?.querySelector(\`slot:not([name])\`)
        ?.assignedNodes() ?? [];
      }

      unrelated2() {}
    }
    `;
    checkTransform(input, expected, options);
  });

  test('private @eventOptions', () => {
    const input = `
    import {eventOptions} from 'lit/decorators.js';
    import {LitElement, html} from 'lit';

    class MyElement extends LitElement {
      unrelated1() {}

      // _onClick comment
      @eventOptions({capture: true, once: false, passive: true})
      private _onClick(event) {
        console.log('click', event.target);
      }

      unrelated2() {}

      render() {
        return html\`
        <button @click=\${this._onClick}></button>
        \`;
      }
    }
    `;

    const expected = `
    import {LitElement, html} from 'lit';

    class MyElement extends LitElement {
      unrelated1() {}

      // _onClick comment
      _onClick(event) {
        console.log('click', event.target);
      }

      unrelated2() {}

      render() {
        return html\`
          <button @click=\${{
            handleEvent: (e) => this._onClick(e),
            capture: true,
            once: false,
            passive: true
          }}></button>
        \`;
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('private @eventOptions with reversed import order', () => {
    // Regression test for a bug where import order mattered.
    const input = `
    import {LitElement, html} from 'lit';
    import {eventOptions} from 'lit/decorators.js';

    class MyElement extends LitElement {
      @eventOptions({capture: true, once: false, passive: true})
      private _onClick(event) {
        console.log('click', event.target);
      }

      render() {
        return html\`
          <button @click=\${this._onClick}></button>
        \`;
      }
    }
    `;

    const expected = `
    import {LitElement, html} from 'lit';

    class MyElement extends LitElement {
      _onClick(event) {
        console.log('click', event.target);
      }

      render() {
        return html\`
          <button @click=\${{
            handleEvent: (e) => this._onClick(e),
            capture: true,
            once: false,
            passive: true
          }}></button>
        \`;
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('private @eventOptions but not an event binding', () => {
    const input = `
    import {LitElement, html, svg} from 'lit';
    import {eventOptions} from 'lit/decorators.js';

    class MyElement extends LitElement {
      @eventOptions({capture: true, once: false, passive: true})
      private _onClick(event) {
        console.log('click', event.target);
      }

      a() {
        return this._onClick;
      }
      b() {
        return html\`<p click=\${this._onClick}</p>\`;
      }
      c() {
        return svg\`<p @click=\${this._onClick}</p>\`;
      }
    }
    `;

    const expected = `
    import {LitElement, html, svg} from 'lit';

    class MyElement extends LitElement {
      _onClick(event) {
        console.log('click', event.target);
      }

      a() {
        return this._onClick;
      }
      b() {
        return html\`<p click=\${this._onClick}</p>\`;
      }
      c() {
        return svg\`<p @click=\${this._onClick}</p>\`;
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('private @eventOptions but different html tag', () => {
    const input = `
    import {LitElement} from 'lit';
    import {eventOptions} from 'lit/decorators.js';
    import {html} from './not-lit.js';

    class MyElement extends LitElement {
      @eventOptions({capture: true, once: false, passive: true})
      private _onClick(event) {
        console.log('click', event.target);
      }

      render() {
        return html\`<p @click=\${this._onClick}</p>\`;
      }
    }
    `;

    const expected = `
    import {LitElement} from 'lit';
    import {html} from './not-lit.js';

    class MyElement extends LitElement {
      _onClick(event) {
        console.log('click', event.target);
      }

      render() {
        return html\`<p @click=\${this._onClick}</p>\`;
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('public @eventOptions', () => {
    const input = `
    import {LitElement, html} from 'lit';
    import {eventOptions} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // _onClick comment
      @eventOptions({capture: true, once: false, passive: true})
      _onClick(event) {
        console.log('click', event.target);
      }

      render() {
        return html\`
          <button @click=\${this._onClick}></button>
        \`;
      }
    }
    `;

    const expected = `
    import {LitElement, html} from 'lit';

    class MyElement extends LitElement {
      // _onClick comment
      _onClick(event) {
        console.log('click', event.target);
      }

      render() {
        return html\`
          <button @click=\${this._onClick}></button>
        \`;
      }
    }
    Object.assign(MyElement.prototype._onClick, {
      capture: true,
      once: false,
      passive: true
    });
    `;
    checkTransform(input, expected, options);
  });

  test('public and private @eventOptions', () => {
    const input = `
    import {LitElement, html} from 'lit';
    import {eventOptions} from 'lit/decorators.js';

    class MyElement extends LitElement {
      @eventOptions({capture: true})
      _public(event) {
        console.log('click', event.target);
      }

      @eventOptions({passive: true})
      private _private(event) {
        console.log('click', event.target);
      }

      render() {
        return html\`
          <button @click=\${this._public}></button>
          <button @click=\${this._private}></button>
        \`;
      }
    }
    `;

    const expected = `
    import {LitElement, html} from 'lit';

    class MyElement extends LitElement {
      _public(event) {
        console.log('click', event.target);
      }

      _private(event) {
        console.log('click', event.target);
      }

      render() {
        return html\`
        <button @click=\${this._public}></button>
        <button @click=\${{handleEvent: (e) => this._private(e), passive: true}}></button>
      \`;
      }
    }
    Object.assign(MyElement.prototype._public, { capture: true });
    `;
    checkTransform(input, expected, options);
  });

  test('@eventOptions and @property', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property, eventOptions} from 'lit/decorators.js';

    export class MyElement extends LitElement {
      @property()
      foo = 123;

      // onClick comment
      @eventOptions({once: true})
      private onClick() {
        console.log('click');
      }
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {LitElement} from 'lit';

      export class MyElement extends LitElement {
        static properties = {
          foo: {},
        };

        constructor() {
          super();
          this.foo = 123;
        }

        // onClick comment
        onClick() {
          console.log('click');
        }
      }
      `;
    } else {
      expected = `
      import {LitElement} from 'lit';

      export class MyElement extends LitElement {
        constructor() {
          super();
          this.foo = 123;
        }

        // onClick comment
        onClick() {
          console.log('click');
        }
      }
      MyElement.properties = {
        foo: {},
      };
      `;
    }
    checkTransform(input, expected, options);
  });

  for (const specifier of [
    'lit/decorators.js',
    'lit/decorators/custom-element.js',
    '@lit/reactive-element/decorators.js',
    '@lit/reactive-element/decorators/custom-element.js',
    'lit-element/decorators.js',
  ]) {
    test(`various valid import specifiers [${specifier}]`, () => {
      const input = `
      import {LitElement} from 'lit';
      import {customElement} from '${specifier}';

      @customElement('my-element')
      class MyElement extends LitElement {
      }
      `;

      const expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
      }
      customElements.define('my-element', MyElement);
      `;
      checkTransform(input, expected, options);
    });
  }

  for (const specifier of [
    'lit/decorators',
    'lit/decorators/custom-element',
    '@lit/reactive-element/decorators',
    '@lit/reactive-element/decorators/custom-element',
    'lit-element/decorators',
  ]) {
    test(`various invalid import specifiers [${specifier}]`, () => {
      const input = `
      import {LitElement} from 'lit';
      import {customElement} from '${specifier}';

      @customElement('my-element')
      class MyElement extends LitElement {
      }
      `;
      assert.throws(
        () => checkTransform(input, '', options),
        `Invalid Lit import style. Did you mean '${specifier}.js'?`
      );
    });
  }

  test('only remove imports that will be transformed', () => {
    const input = `
    import {LitElement} from 'lit-element';
    import {customElement} from 'lit-element/decorators.js';

    @customElement('my-element')
    class MyElement extends LitElement {
    }
    `;

    const expected = `
    import {LitElement} from 'lit-element';

    class MyElement extends LitElement {
    }
    customElements.define('my-element', MyElement);
    `;
    checkTransform(input, expected, options);
  });

  test("don't remove existing no-binding import", () => {
    const input = `
    import {LitElement} from 'lit-element';
    import {customElement} from 'lit-element/decorators.js';
    import './my-custom-element.js';

    @customElement('my-element')
    class MyElement extends LitElement {
    }
    `;

    const expected = `
    import {LitElement} from 'lit-element';
    import './my-custom-element.js';

    class MyElement extends LitElement {
    }
    customElements.define('my-element', MyElement);
    `;
    checkTransform(input, expected, options);
  });

  test('ignore non-lit class decorator', () => {
    const input = `
    import {LitElement} from 'lit';
    import {customElement} from './not-lit.js';

    @customElement('my-element')
    class MyElement extends LitElement {
    }
    `;

    const expected = `
    import {__decorate} from 'tslib';
    import {LitElement} from 'lit';
    import {customElement} from './not-lit.js';

    let MyElement = class MyElement extends LitElement {};

    MyElement = __decorate([customElement("my-element")], MyElement);
    `;
    checkTransform(input, expected, options);
  });

  test('ignore non-lit method decorator', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property} from './not-lit.js';

    class MyElement extends LitElement {
      @property()
      foo;
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {__decorate} from 'tslib';
      import {LitElement} from 'lit';
      import {property} from './not-lit.js';

      class MyElement extends LitElement {
        foo;
      };
      __decorate([property()], MyElement.prototype, "foo", void 0);
      `;
    } else {
      expected = `
      import {__decorate} from 'tslib';
      import {LitElement} from 'lit';
      import {property} from './not-lit.js';

      class MyElement extends LitElement {
      };
      __decorate([property()], MyElement.prototype, "foo", void 0);
      `;
    }
    checkTransform(input, expected, options);
  });

  test('aliased class decorator import', () => {
    const input = `
    import {LitElement} from 'lit';
    import {customElement as cabbage} from 'lit/decorators.js';

    // class comment
    @cabbage('my-element')
    class MyElement extends LitElement {
    }
    `;

    const expected = `
    import {LitElement} from 'lit';

    // class comment
    class MyElement extends LitElement {
    }
    customElements.define('my-element', MyElement);
    `;
    checkTransform(input, expected, options);
  });

  test('aliased property decorator import', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property as potato} from 'lit/decorators.js';

    class MyElement extends LitElement {
      // str comment
      @potato()
      str = "foo";

      // num comment
      @potato({type: Number, attribute: false})
      num = 42;
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        static properties = {
          str: {},
          num: {type: Number, attribute: false},
        };

        constructor() {
          super();
          // str comment
          this.str = "foo";
          // num comment
          this.num = 42;
        }
      }
      `;
    } else {
      expected = `
      import {LitElement} from 'lit';

      class MyElement extends LitElement {
        constructor() {
          super();
          // str comment
          this.str = "foo";
          // num comment
          this.num = 42;
        }
      }
      MyElement.properties = {
        str: {},
        num: {type: Number, attribute: false},
      };
      `;
    }
    checkTransform(input, expected, options);
  });

  test('@localized', () => {
    const input = `
    import {LitElement} from 'lit';
    import {localized} from '@lit/localize';

    @localized()
    class MyElement extends LitElement {
    }
    `;

    const expected = `
    import {LitElement} from 'lit';
    import {updateWhenLocaleChanges} from '@lit/localize';

    class MyElement extends LitElement {
      constructor() {
        super();
        updateWhenLocaleChanges(this);
      }
    }
    `;
    checkTransform(input, expected, options);
  });

  test('@localized (with property)', () => {
    const input = `
    import {LitElement} from 'lit';
    import {property} from 'lit/decorators.js';
    import {localized} from '@lit/localize';

    @localized()
    class MyElement extends LitElement {
      // foo comment
      @property()
      foo = 123;
    }
    `;

    let expected;
    if (options.useDefineForClassFields) {
      expected = `
      import {LitElement} from 'lit';
      import {updateWhenLocaleChanges} from '@lit/localize';

      class MyElement extends LitElement {
        static properties = {
          foo: {},
        };

        constructor() {
          super();
          updateWhenLocaleChanges(this);
          // foo comment
          this.foo = 123;
        }
      }
      `;
    } else {
      expected = `
      import {LitElement} from 'lit';
      import {updateWhenLocaleChanges} from '@lit/localize';

      class MyElement extends LitElement {
        constructor() {
          super();
          updateWhenLocaleChanges(this);
          // foo comment
          this.foo = 123;
        }
      }
      MyElement.properties = {
        foo: {},
      };
      `;
    }
    checkTransform(input, expected, options);
  });

  test('unrelated import with no bindings', () => {
    const input = `
      import './not-lit.js';
    `;
    const expected = `
      import './not-lit.js';
    `;
    checkTransform(input, expected, options);
  });

  test('unrelated import with default import', () => {
    const input = `
      import notLit from './not-lit.js';
      console.log(notLit);
    `;
    const expected = `
      import notLit from './not-lit.js';
      console.log(notLit);
    `;
    checkTransform(input, expected, options);
  });

  test('related + unrelated import with no bindings', () => {
    const input = `
      import './not-lit.js';
      import {customElement} from 'lit/decorators.js';
      `;
    const expected = `
      import './not-lit.js';
      `;
    checkTransform(input, expected, options);
  });

  test('related + unrelated import with default import', () => {
    const input = `
    import notLit from './not-lit.js';
    import {customElement} from 'lit/decorators.js';
    console.log(notLit);
    `;
    const expected = `
    import notLit from './not-lit.js';
    console.log(notLit);
    `;
    checkTransform(input, expected, options);
  });

  test.run();
};

const baseOptions = () => {
  const options = ts.getDefaultCompilerOptions();
  options.moduleResolution = ts.ModuleResolutionKind.NodeJs;
  options.importHelpers = true;
  return options;
};

const standardOptions = baseOptions();
standardOptions.target = ts.ScriptTarget.ESNext;
standardOptions.useDefineForClassFields = true;
tests(suite('standard class field emit'), standardOptions);

const legacyOptions = baseOptions();
legacyOptions.target = ts.ScriptTarget.ES2021;
legacyOptions.useDefineForClassFields = false;
tests(suite('legacy class field emit'), legacyOptions);
