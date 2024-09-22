import {LitElement, html, TemplateResult} from 'lit';
import {createContext, consume, ContextProvider} from '@lit/context';
import {assert} from 'chai';

const simpleContext = createContext<number>('simple-context');

class ContextProviderElement extends LitElement {
  contextProvider = new ContextProvider(this, {
    context: simpleContext,
    initialValue: 0,
  });

  protected render(): TemplateResult {
    return html` <context-consumer-parent></context-consumer-parent> `;
  }
}

let lastValue: number | undefined;

class ContextConsumerParentElement extends LitElement {
  @consume({context: simpleContext, subscribe: true})
  value!: number;

  render() {
    console.log('parent', this.value);
    return this.value === 1
      ? html`<context-consumer-child></context-consumer-child>`
      : html``;
  }
}

class ContextConsumerChildElement extends LitElement {
  @consume({context: simpleContext, subscribe: true})
  value!: number;

  render() {
    console.log('child', this.value, 'connected =', this.isConnected);

    // This should never be rendered with a value other than 1
    lastValue = this.value;
    return html`<div>${this.value}</div>`;
  }
}

customElements.define('context-provider', ContextProviderElement);
customElements.define('context-consumer-parent', ContextConsumerParentElement);
customElements.define('context-consumer-child', ContextConsumerChildElement);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

suite('disconnected', () => {
  test(`does not render after it is disconnected by parent component`, async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const provider = new ContextProviderElement();

    container.appendChild(provider);
    await provider.updateComplete;
    await sleep(100);

    for (const value of [1, 2, 3]) {
      provider.contextProvider.setValue(value);
      await provider.updateComplete;
      await sleep(100);
    }

    assert.equal(lastValue, 1);
  });
});
