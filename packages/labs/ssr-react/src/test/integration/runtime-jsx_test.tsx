/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/** @jsxImportSource @lit-labs/ssr-react */

// eslint-disable-next-line import/extensions
import ReactDOMServer from 'react-dom/server';

import '../test-element.js';

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

test('single element', () => {
  assert.equal(
    ReactDOMServer.renderToString(<test-element />),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template></test-element>`
  );
});

test('single element with prop', () => {
  assert.equal(
    ReactDOMServer.renderToString(<test-element name="World" />),
    `<test-element name="World"><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->World<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template></test-element>`
  );
});

test('single element within DOM element', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <div>
        <test-element />
      </div>
    ),
    `<div><test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template></test-element></div>`
  );
});

test('single element with string child', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element>some string child</test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template>some string child</test-element>`
  );
});

test('single element with element child', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element>
        <span>span child</span>
      </test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template><span>span child</span></test-element>`
  );
});

test('single element with multiple children', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element>
        <span>span</span>
        <p>p</p>
      </test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template><span>span</span><p>p</p></test-element>`
  );
});

test('single element with dynamic children', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element>
        {[1, 2, 3].map((i) => (
          <span key={i}>{i}</span>
        ))}
      </test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template><span>1</span><span>2</span><span>3</span></test-element>`
  );
});

test('single element with string child via props', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element children="some string child"></test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template>some string child</test-element>`
  );
});

test('single element with element child via props', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element children={<span>span child</span>}></test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template><span>span child</span></test-element>`
  );
});

test('single element with multiple children via props', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element
        children={
          <>
            <span>span</span>
            <p>p</p>
          </>
        }
      ></test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template><span>span</span><p>p</p></test-element>`
  );
});

test('single element with dynamic children via props', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element
        children={[1, 2, 3].map((i) => (
          <span key={i}>{i}</span>
        ))}
      ></test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template><span>1</span><span>2</span><span>3</span></test-element>`
  );
});

test('nested element', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <test-element>
        <test-element />
      </test-element>
    ),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template><test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template></test-element></test-element>`
  );
});

test.run();
