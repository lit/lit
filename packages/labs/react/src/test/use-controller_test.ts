/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

// import * as ReactModule from 'react';
import 'react/umd/react.development.js';
import 'react-dom/umd/react-dom.development.js';
import {useController} from '../use-controller.js';
import {assert} from '@esm-bundle/chai';
import {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element';

const {React, ReactDOM} = window;

suite('useController', () => {
  let container: HTMLElement;
  let ctorCallCount = 0;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    ctorCallCount = 0;
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  class TestController implements ReactiveController {
    host: ReactiveControllerHost;
    a: string;

    log: Array<string> = [];

    constructor(host: ReactiveControllerHost, a: string) {
      this.host = host;
      this.a = a;
      host.addController(this);
      ctorCallCount++;
    }

    hostConnected() {
      this.log.push('connected');
    }

    hostDisconnected() {
      this.log.push('disconnected');
    }

    hostUpdate() {
      this.log.push('update');
    }

    hostUpdated() {
      this.log.push('updated');
    }
  }

  const useTest = (a: string) => {
    return useController(
      React,
      (host: ReactiveControllerHost) => new TestController(host, a)
    );
  };

  test('basic lifecycle', () => {
    let testController!: TestController;

    const TestComponent = ({x}: {x: number}) => {
      testController = useTest('a');
      return React.createElement('div', {className: 'foo'}, [
        `x:${x}, a:${testController.a}`,
      ]);
    };

    const render = (props: any) => {
      ReactDOM.render(React.createElement(TestComponent, props), container);
    };

    render({x: 1});
    assert.equal(ctorCallCount, 1);
    assert.equal(container.innerHTML, `<div class="foo">x:1, a:a</div>`);
    assert.deepEqual(testController.log, ['connected', 'update', 'updated']);
    const firstTestController = testController;

    testController.log.length = 0;
    render({x: 2});
    assert.equal(ctorCallCount, 1);
    assert.equal(container.innerHTML, `<div class="foo">x:2, a:a</div>`);
    assert.deepEqual(testController.log, ['update', 'updated']);
    assert.strictEqual(testController, firstTestController);
  });

  test('requestUpdate', async () => {
    let testController!: TestController;

    const TestComponent = ({x}: {x: number}) => {
      testController = useTest('a');
      return React.createElement('div', {className: 'foo'}, [
        `x:${x}, a:${testController.a}`,
      ]);
    };

    const render = (props: any) => {
      ReactDOM.render(React.createElement(TestComponent, props), container);
    };

    render({x: 1});
    assert.deepEqual(testController.log, ['connected', 'update', 'updated']);
    testController.log.length = 0;
    testController.a = 'b';
    testController.host.requestUpdate();

    await new Promise((r) => setTimeout(r, 0));

    assert.equal(container.innerHTML, `<div class="foo">x:1, a:b</div>`);
    assert.deepEqual(testController.log, ['update', 'updated']);
  });

  test('disconnect', () => {
    let testController!: TestController;

    const TestComponent = ({x}: {x: number}) => {
      testController = useTest('a');
      return React.createElement('div', {className: 'foo'}, [
        `x:${x}, a:${testController.a}`,
      ]);
    };

    ReactDOM.render(React.createElement(TestComponent, {x: 1}), container);
    assert.deepEqual(testController.log, ['connected', 'update', 'updated']);
    testController.log.length = 0;

    ReactDOM.render(React.createElement('div'), container);
    assert.equal(container.innerHTML, `<div></div>`);
    assert.deepEqual(testController.log, ['disconnected']);
  });

  test('updateComplete', async () => {
    let testController!: TestController;
    let updateCompleteCount = 0;
    let lastNestedUpdate: boolean | undefined;
    let rerender = false;

    const TestComponent = ({x}: {x: number}) => {
      testController = useTest('a');
      testController.host.updateComplete.then((nestedUpdate) => {
        updateCompleteCount++;
        lastNestedUpdate = nestedUpdate;
      });
      if (rerender) {
        // prevent an infinite loop
        rerender = false;
        testController.host.requestUpdate();
      }
      return React.createElement('div', {className: 'foo'}, [
        `x:${x}, a:${testController.a}`,
      ]);
    };

    const render = (props: any) => {
      ReactDOM.render(React.createElement(TestComponent, props), container);
    };

    render({x: 1});
    assert.deepEqual(testController.log, ['connected', 'update', 'updated']);
    testController.log.length = 0;
    await 0;
    assert.equal(updateCompleteCount, 1);
    assert.strictEqual(lastNestedUpdate, false);

    // cause a requestUpdate() during render
    rerender = true;
    render({x: 2});
    await 0;
    // Expect only one more renders since requestUpdate() is called
    // during render
    assert.equal(updateCompleteCount, 2);
    assert.strictEqual(lastNestedUpdate, false);

    await 0;

    assert.equal(updateCompleteCount, 2);
  });
});
