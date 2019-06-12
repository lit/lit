import { LitVirtualizer, scroll } from '../lit-virtualizer.js'
import { html, render } from 'lit-html'

describe('<lit-virtualizer>', function () {
  it('is running the tests', function () {
    assert.equal(1 + 1, 2);
  });

  it('registers lit-virtualizer as a custom element', function () {
    const lvs = document.createElement('lit-virtualizer');
    assert.instanceOf(lvs, LitVirtualizer);
  });
});

describe('scroll', function () {
  let container;

  beforeEach(function() {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(function() {
    document.body.removeChild(container);
  })

  it('uses the template to render the items', async function () {
    const dir = scroll({
      items: ['foo', 'bar', 'baz'],
      template: (item) => html`<p>${item}</p>`,
      useShadowDOM: false
    });
    const templateResult = html`<div>
      ${dir}
    </div>`

    render(templateResult, container);

    // must wait an animation frame to let render finish.
    await (new Promise(resolve => requestAnimationFrame(resolve)));
    assert.include(container.innerHTML, 'foo');
    assert.include(container.innerHTML, 'bar');
    assert.include(container.innerHTML, 'baz');
    // must return in async test per Mocha specs.
    return
  });

  describe('useShadowDOM', function() {
    it('renders to shadow DOM when useShadowDOM is true', async function() {
      const dir = scroll({
        items: ['foo', 'bar', 'baz'],
        template: (item) => html`<p>${item}</p>`,
        useShadowDOM: true,
      });
      const templateResult = html`${dir}`
  
      render(templateResult, container);
  
      await (new Promise(resolve => requestAnimationFrame(resolve)));
      assert.exists(container.shadowRoot);
      return
    });

    it('does not render to shadow DOM when useShadowDOM is false', async function() {
      const dir = scroll({
        items: ['foo', 'bar', 'baz'],
        template: (item) => html`<p>${item}</p>`,
        useShadowDOM: false,
      });
      const templateResult = html`${dir}`
  
      render(templateResult, container);
  
      await (new Promise(resolve => requestAnimationFrame(resolve)));
      assert.notExists(container.shadowRoot);
      return
    });
  })
});