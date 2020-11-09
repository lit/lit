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

import {LitElement, html} from 'lit-element';
import {
  createContext,
  Provider,
  Consumer,
  UpdatingController,
} from '../../controllers/context.js';
import {nextFrame, queryDeep} from '../test-helpers';
import {assert} from '@esm-bundle/chai';

suite('Context', () => {
  let container: HTMLElement;

  const rootContext = createContext({
    initialValue: 'root',
  });

  const dataContext = createContext({
    initialValue: {name: 'name'},
  });

  const numContext = createContext();

  const subContext = createContext();

  class MyController extends UpdatingController {
    context = new subContext.consumer(this.host);

    get value() {
      return this.context.value;
    }
  }

  class CustomNameProvider extends Provider {
    constructor(host: LitElement, value: any) {
      super(host, value);
      this.value = this.host.localName;
    }
  }

  class CustomNameConsumer extends Consumer {
    providerName?: any;
    _setValue(value: any) {
      super._setValue(value);
      this.providerName = this.value;
    }
  }

  const customNameContext = createContext({
    ProviderClass: CustomNameProvider,
    ConsumerClass: CustomNameConsumer,
  });

  class AConsumer extends LitElement {
    static properties = {foo: {}};

    data = new dataContext.consumer(this);
    num = new numContext.consumer(this);
    controller = new MyController(this);
    root = new rootContext.consumer(this);
    customName = new customNameContext.consumer(this);

    render() {
      return html`<div>${this.data.value?.name}</div>
        <div>${this.num.value}</div>
        <div>${this.controller.value}</div>`;
    }
  }
  customElements.define('consumer-el', AConsumer);

  class AContainer extends LitElement {
    render() {
      return html`<div>
        <consumer-el></consumer-el>
        <consumer-el></consumer-el>
      </div>`;
    }
  }
  customElements.define('container-el', AContainer);

  class AProvider extends LitElement {
    static properties = {foo: {}};

    data = new dataContext.provider(this);
    num1 = new numContext.provider(this, 1);
    num2 = new numContext.provider(this, 2);
    root = new rootContext.provider(this);
    sub = new subContext.provider(this);
    customName = new customNameContext.provider(this);

    constructor() {
      super();
      // provide to entire tree
      this.root.provideAll();
      this.customName.provideAll();
      this.sub.provideAll();
      this.sub.value = 'sub';
    }

    render() {
      return html`<div .=${this.data.provide()}>
          <div .=${this.num1.provide()}><container-el></container-el></div>
          <div .=${this.num2.provide()}>
            <div>
              <container-el></container-el>
            </div>
          </div>
        </div>
        <container-el></container-el>`;
    }
  }
  customElements.define('provider-el', AProvider);
  let el!: AProvider;
  let consumers!: AConsumer[];

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    el = new AProvider();
    container.appendChild(el);
    await nextFrame();
    consumers = (queryDeep(
      el.renderRoot as ShadowRoot,
      'consumer-el'
    ) as unknown) as AConsumer[];
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const testValues = ({
    root = 'root',
    sub = 'sub',
    data,
    num1,
    num2,
  }: {
    root?: string;
    sub?: string;
    data: {name: string};
    num1: number;
    num2: number;
  }) => {
    consumers.forEach((consumer, i) => {
      assert.deepEqual(consumer.root.value, root);
      assert.deepEqual(consumer.controller.value, sub);
      assert.deepEqual(consumer.data.value, i < 4 ? data : undefined);
      assert.equal(consumer.num.value, i < 2 ? num1 : i < 4 ? num2 : undefined);
    });
  };

  test('values provided to consumers', async () => {
    testValues({data: {name: 'name'}, num1: 1, num2: 2});
    el.data.value = {name: 'foo'};
    el.num1.value = 5;
    el.num2.value = 10;
    testValues({data: {name: 'foo'}, num1: 5, num2: 10});
    el.data.value = {name: 'bar'};
    el.num1.value = 15;
    testValues({data: {name: 'bar'}, num1: 15, num2: 10});
    el.root.value = 'root2';
    el.sub.value = 'sub2';
    testValues({
      root: 'root2',
      sub: 'sub2',
      data: {name: 'bar'},
      num1: 15,
      num2: 10,
    });
  });

  test('providing values stops/starts with disconnect/connect', async () => {
    consumers.forEach((consumer) => {
      (consumer as any)._parent = consumer.parentNode;
      consumer.remove();
    });
    testValues({data: {name: 'name'}, num1: 1, num2: 2});
    // Values don't change when disconnected
    el.data.value = {name: 'foo'};
    el.num1.value = 5;
    el.num2.value = 10;
    testValues({data: {name: 'name'}, num1: 1, num2: 2});
    // Values synchronized when re-connected
    consumers.forEach((consumer) =>
      ((consumer as any)._parent as Element).append(consumer)
    );
    testValues({data: {name: 'foo'}, num1: 5, num2: 10});
    el.num2.value = 15;
    testValues({data: {name: 'foo'}, num1: 5, num2: 15});
  });

  test('values provided to consumer using custom context', async () => {
    consumers.forEach((consumer) => {
      assert.equal(
        (consumer.customName as CustomNameConsumer).providerName,
        'provider-el'
      );
    });
  });
});
