import {MyElement} from '../my-element.js';

// import {fixture, html} from '@open-wc/testing';
// =========================================================
// TODO(kschaaf): Switch back to @open-wc/testing:fixture once it is upgraded to
// work with lit-next (https://github.com/open-wc/open-wc/pull/1851)
import '@open-wc/testing/import-wrappers/chai.js';
import '@open-wc/testing/register-chai-plugins.js';
import '@open-wc/semantic-dom-diff';
const html = (s: TemplateStringsArray) => s.join('');
const fixture = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.body.firstElementChild;
  await (el as MyElement)?.updateComplete;
  return el;
};
// =========================================================

const assert = chai.assert;

suite('my-element', () => {
  test('is defined', () => {
    const el = document.createElement('my-element');
    assert.instanceOf(el, MyElement);
  });

  test('renders with default values', async () => {
    const el = await fixture(html`<my-element></my-element>`);
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, World!</h1>
      <button part="button">Click Count: 0</button>
      <slot></slot>
    `
    );
  });

  test('renders with a set name', async () => {
    const el = await fixture(html`<my-element name="Test"></my-element>`);
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, Test!</h1>
      <button part="button">Click Count: 0</button>
      <slot></slot>
    `
    );
  });

  test('handles a click', async () => {
    const el = (await fixture(html`<my-element></my-element>`)) as MyElement;
    const button = el.shadowRoot!.querySelector('button')!;
    button.click();
    await el.updateComplete;
    assert.shadowDom.equal(
      el,
      `
      <h1>Hello, World!</h1>
      <button part="button">Click Count: 1</button>
      <slot></slot>
    `
    );
  });
});
