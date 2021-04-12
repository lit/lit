/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  html as htmlA,
  render as renderA,
  nothing as nothingA,
  noChange as noChangeA,
} from '../../lit-html.js';
import {
  directive as directiveA,
  Directive as DirectiveA,
  PartType as PartTypeA,
} from '../../directive.js';
import {AsyncDirective as AsyncDirectiveA} from '../../async-directive.js';
import {repeat as repeatA} from '../../directives/repeat.js';

import {
  html as htmlB,
  render as renderB,
  nothing as nothingB,
  noChange as noChangeB,
} from '../../version-stability-build/lit-html.js';
import {
  directive as directiveB,
  Directive as DirectiveB,
  PartType as PartTypeB,
} from '../../version-stability-build/directive.js';
import {AsyncDirective as AsyncDirectiveB} from '../../version-stability-build/async-directive.js';
import {repeat as repeatB} from '../../version-stability-build/directives/repeat.js';

import {stripExpressionComments} from '../../development/test/test-utils/strip-markers.js';
import {assert} from '@esm-bundle/chai';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const dirA = directiveA(
  class extends DirectiveA {
    constructor(partInfo) {
      super(partInfo);
      this.partInfo = partInfo;
    }
    render(v) {
      if (this.partInfo.type !== PartTypeA.ATTRIBUTE) {
        throw new Error('expected PartType.ATTRIBUTE');
      }
      const {tagName, name, strings} = this.partInfo;
      return `[${v}:${tagName}:${name}:${strings.join(':')}]`;
    }
  }
);

const dirB = directiveB(
  class extends DirectiveB {
    constructor(partInfo) {
      super(partInfo);
      this.partInfo = partInfo;
    }
    render(v) {
      if (this.partInfo.type !== PartTypeB.ATTRIBUTE) {
        throw new Error('expected PartType.ATTRIBUTE');
      }
      const {tagName, name, strings} = this.partInfo;
      return `[${v}:${tagName}:${name}:${strings.join(':')}]`;
    }
  }
);

const passthruA = directiveA(
  class extends DirectiveA {
    render(v) {
      return v;
    }
  }
);

const passthruB = directiveA(
  class extends DirectiveB {
    render(v) {
      return v;
    }
  }
);

const asyncA = directiveA(
  class extends AsyncDirectiveA {
    render(v, cb) {
      this.cb = cb;
      this.cb(true);
      Promise.resolve().then(() => this.setValue(v));
    }
    disconnected() {
      this.cb(false);
    }
    reconnected() {
      this.cb(true);
    }
  }
);

const asyncB = directiveA(
  class extends AsyncDirectiveB {
    render(v, cb) {
      this.cb = cb;
      this.cb(true);
      Promise.resolve().then(() => this.setValue(v));
    }
    disconnected() {
      this.cb(false);
    }
    reconnected() {
      this.cb(true);
    }
  }
);

suite('version-stability', () => {
  let container;

  setup(() => {
    container = document.createElement('div');
  });

  const assertContent = (expected) => {
    assert.equal(stripExpressionComments(container.innerHTML), expected);
  };

  test('renderA with htmlB', () => {
    renderA(htmlB`<div>${'test'}</div>`, container);
    assertContent('<div>test</div>');
  });

  test('renderB with htmlA', () => {
    renderB(htmlA`<div>${'test'}</div>`, container);
    assertContent('<div>test</div>');
  });

  test('renderA with nothingB and noChangeB', () => {
    const template = (v) => htmlA`<div>${v}</div>`;
    renderA(template('test'), container);
    assertContent('<div>test</div>');
    renderA(template(nothingB), container);
    assertContent('<div></div>');
    renderA(template('test'), container);
    assertContent('<div>test</div>');
    renderA(template(noChangeB), container);
    assertContent('<div>test</div>');
  });

  test('renderB with nothingA and noChangeA', () => {
    const template = (v) => htmlA`<div>${v}</div>`;
    renderB(template('test'), container);
    assertContent('<div>test</div>');
    renderB(template(nothingA), container);
    assertContent('<div></div>');
    renderB(template('test'), container);
    assertContent('<div>test</div>');
    renderB(template(noChangeA), container);
    assertContent('<div>test</div>');
  });

  test('renderA with directiveB', () => {
    renderA(htmlB`<div title="a${dirB('B')}b"></div>`, container);
    assertContent('<div title="a[B:DIV:title:a:b]b"></div>');
  });

  test('renderB with directiveA', () => {
    renderB(htmlA`<div title="a${dirA('A')}b"></div>`, container);
    assertContent('<div title="a[A:DIV:title:a:b]b"></div>');
  });

  test('renderA with directiveA nested in passthruB', () => {
    renderA(htmlB`<div title="a${passthruB(dirA('A'))}b"></div>`, container);
    assertContent('<div title="a[A:DIV:title:a:b]b"></div>');
  });

  test('renderB with directiveB nested in passthruA', () => {
    renderB(htmlA`<div title="a${passthruA(dirB('B'))}b"></div>`, container);
    assertContent('<div title="a[B:DIV:title:a:b]b"></div>');
  });

  test('renderA with asyncB', async () => {
    let connected = true;
    const cb = (c) => (connected = c);
    const template = (bool) =>
      htmlA`<div>${bool ? asyncB('B', cb) : nothingA}</div>`;
    renderA(template(true), container);
    assertContent('<div></div>');
    assert.isTrue(connected);
    // Wait until directive updates value.
    await nextFrame();
    assertContent('<div>B</div>');
    renderA(template(false), container);
    assert.isFalse(connected);
    assertContent('<div></div>');
    const part = renderA(template(true), container);
    assert.isTrue(connected);
    await nextFrame();
    assertContent('<div>B</div>');
    part.setConnected(false);
    assert.isFalse(connected);
    assertContent('<div>B</div>');
    part.setConnected(true);
    assert.isTrue(connected);
    assertContent('<div>B</div>');
  });

  test('renderB with asyncA', async () => {
    let connected = false;
    const cb = (c) => (connected = c);
    const template = (bool) =>
      htmlB`<div>${bool ? asyncA('A', cb) : nothingB}</div>`;
    renderB(template(true), container);
    assertContent('<div></div>');
    assert.isTrue(connected);
    await nextFrame();
    assertContent('<div>A</div>');
    renderB(template(false), container);
    assert.isFalse(connected);
    assertContent('<div></div>');
    const part = renderB(template(true), container);
    assert.isTrue(connected);
    await nextFrame();
    assertContent('<div>A</div>');
    part.setConnected(false);
    assert.isFalse(connected);
    assertContent('<div>A</div>');
    part.setConnected(true);
    assert.isTrue(connected);
    assertContent('<div>A</div>');
  });

  test('renderA with repeatB rendering htmlA and passthruB', () => {
    const items = [0, 1, 2];
    renderA(
      htmlA`<div>${repeatB(
        items,
        (item) => htmlA`<p>${passthruB(`B${item}`)}</p>`
      )}</div>`,
      container
    );
    assertContent('<div><p>B0</p><p>B1</p><p>B2</p></div>');
  });

  test('renderB with repeatA rendering htmlB and passthruA', () => {
    const items = [0, 1, 2];
    renderB(
      htmlB`<div>${repeatA(
        items,
        (item) => htmlB`<p>${passthruA(`A${item}`)}</p>`
      )}</div>`,
      container
    );
    assertContent('<div><p>A0</p><p>A1</p><p>A2</p></div>');
  });

  test('renderA with repeatB rendering asyncA', async () => {
    const items = [0];
    let connected = false;
    const cb = (c) => (connected = c);
    const template = (bool) =>
      htmlA`<div>${
        bool
          ? repeatB(items, (item) => htmlA`<p>${asyncA(`A${item}`, cb)}</p>`)
          : nothingB
      }</div>`;
    renderA(template(true, cb), container);
    assert.isTrue(connected);
    assertContent('<div><p></p></div>');
    await nextFrame();
    assertContent('<div><p>A0</p></div>');
    renderA(template(false, cb), container);
    assert.isFalse(connected);
    assertContent('<div></div>');
    const part = renderA(template(true, cb), container);
    assert.isTrue(connected);
    assertContent('<div><p></p></div>');
    await nextFrame();
    assertContent('<div><p>A0</p></div>');
    part.setConnected(false);
    assert.isFalse(connected);
    assertContent('<div><p>A0</p></div>');
    part.setConnected(true);
    assert.isTrue(connected);
    assertContent('<div><p>A0</p></div>');
  });

  test('renderB with repeatA rendering asyncB', async () => {
    const items = [0];
    let connected = false;
    const cb = (c) => (connected = c);
    const template = (bool) =>
      htmlB`<div>${
        bool
          ? repeatA(items, (item) => htmlB`<p>${asyncB(`B${item}`, cb)}</p>`)
          : nothingA
      }</div>`;
    renderB(template(true, cb), container);
    assert.isTrue(connected);
    assertContent('<div><p></p></div>');
    await nextFrame();
    assertContent('<div><p>B0</p></div>');
    renderA(template(false, cb), container);
    assert.isFalse(connected);
    assertContent('<div></div>');
    const part = renderA(template(true, cb), container);
    assert.isTrue(connected);
    assertContent('<div><p></p></div>');
    await nextFrame();
    assertContent('<div><p>B0</p></div>');
    part.setConnected(false);
    assert.isFalse(connected);
    assertContent('<div><p>B0</p></div>');
    part.setConnected(true);
    assert.isTrue(connected);
    assertContent('<div><p>B0</p></div>');
  });
});
