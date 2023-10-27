/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import '@lit-labs/ssr-react/enable-lit-ssr.js';
import React from 'react';
// eslint-disable-next-line import/extensions
import ReactDOMServer from 'react-dom/server';
import {createComponent} from '@lit/react';

import {TestElement} from '../test-element.js';
import '../test-element.js';
import {ObjectTestElement} from '../object-test-element.js';
import '../object-test-element.js';

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

const bareCEtest = suite('Bare custom elements');

bareCEtest('single element', () => {
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

bareCEtest('single element with prop', () => {
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

bareCEtest('single element within DOM element', () => {
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

bareCEtest('single element with string child', () => {
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

bareCEtest('single element with element child', () => {
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

bareCEtest('single element with multiple children', () => {
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

bareCEtest('single element with dynamic children', () => {
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

bareCEtest('single element with string child via props', () => {
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

bareCEtest('single element with element child via props', () => {
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

bareCEtest('single element with multiple children via props', () => {
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

bareCEtest('single element with dynamic children via props', () => {
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

bareCEtest('nested element', () => {
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

bareCEtest.run();

const wrappedCEtest = suite('@lit/react wrapped custom elements');

const ReactTestElement = createComponent({
  react: React,
  tagName: 'test-element',
  elementClass: TestElement,
});

wrappedCEtest('wrapped element without prop', () => {
  assert.equal(
    ReactDOMServer.renderToString(<ReactTestElement />),
    `<test-element><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->Somebody<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template></test-element>`
  );
});

wrappedCEtest('wrapped element with prop', () => {
  assert.equal(
    ReactDOMServer.renderToString(<ReactTestElement name="React" />),
    `<test-element defer-hydration=""><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->React<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template></test-element>`
  );
});

wrappedCEtest('wrapped element with prop and attribute', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <ReactTestElement name="React" id="react-test-element" />
    ),
    `<test-element id="react-test-element" defer-hydration=""><template shadowroot="open" shadowrootmode="open"><style>
    p {
      color: blue;
    }
  </style><!--lit-part aHUgh01By8I=--><p>Hello, <!--lit-part-->React<!--/lit-part-->!</p>
      <slot></slot><!--/lit-part--></template></test-element>`
  );
});

const ReactObjectTestElement = createComponent({
  react: React,
  tagName: 'object-test-element',
  elementClass: ObjectTestElement,
});

wrappedCEtest('wrapped element with object prop', () => {
  assert.equal(
    ReactDOMServer.renderToString(
      <ReactObjectTestElement user={{name: 'React'}} />
    ),
    `<object-test-element defer-hydration=""><template shadowroot="open" shadowrootmode="open"><!--lit-part EvGichL14uw=--><p>Hello, <!--lit-part-->React<!--/lit-part-->!</p><!--/lit-part--></template></object-test-element>`
  );
});

wrappedCEtest.run();
