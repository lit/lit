import { LitVirtualizer, scroll, Layout1d } from '../lit-virtualizer.js'
import { html, render } from 'lit-html'

describe('<lit-virtualizer>', function () {
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
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  it('uses the provided method to render items', async function () {
    const example = html`
      ${scroll({
        items: ['foo', 'bar', 'baz'],
        renderItem: (item) => html`<p>${item}</p>`,
        layout: Layout1d
      })}
    `;

    render(example, container);

    // must wait an animation frame to let render finish.
    await (new Promise(resolve => requestAnimationFrame(resolve)));
    assert.include(container.innerHTML, 'foo');
    assert.include(container.innerHTML, 'bar');
    assert.include(container.innerHTML, 'baz');
    // must remove child _before_ end of spec. TODO @straversi: find a way
    // to move into afterEach.
    document.body.removeChild(container);
  });

  // TODO (graynorton): We no longer have an explicit `useShadowDOM`
  // API, but we should write some tests to cover the new (automatic)
  // behavior of using a shadow root iff native Shadow DOM is available

  // describe('useShadowDOM', function() {
  //   it('renders to shadow DOM when useShadowDOM is true', async function() {
  //     const example = html`
  //       ${scroll({
  //         items: ['foo', 'bar', 'baz'],
  //         renderItem: (item) => html`<p>${item}</p>`,
  //         useShadowDOM: true
  //       })}
  //     `;

  //     render(example, container);
  
  //     await (new Promise(resolve => requestAnimationFrame(resolve)));
  //     assert.exists(container.shadowRoot);

  //     document.body.removeChild(container);
  //   });

  //   it('does not render to shadow DOM when useShadowDOM is false', async function() {
  //     const example = html`
  //       ${scroll({
  //         items: ['foo', 'bar', 'baz'],
  //         renderItem: (item) => html`<p>${item}</p>`,
  //         useShadowDOM: false
  //       })}
  //     `;

  //     render(example, container);
  
  //     await (new Promise(resolve => requestAnimationFrame(resolve)));
  //     assert.notExists(container.shadowRoot);

  //     document.body.removeChild(container);
  //   });
  // })

  describe('visible indices', function() {
    it('emits visibilityChanged events with the proper indices', async function() {
      const directive = scroll({
        items: ['foo', 'bar', 'baz', 'qux'],
        renderItem: (item) => html`<div style='height: 50px'>${item}</div>`,
        layout: Layout1d
      });
      container.style.height = '100px';
      let firstVisible;
      let lastVisible;
      container.addEventListener('visibilityChanged', e => {
        firstVisible = e.detail.firstVisible;
        lastVisible = e.detail.lastVisible;
      });
  
      render(directive, container);
  
      await (new Promise(resolve => requestAnimationFrame(resolve)));
      container.scrollTop = 50;
      await (new Promise(resolve => requestAnimationFrame(resolve)));
      assert.equal(firstVisible, 1);
      assert.equal(lastVisible, 2);
      container.scrollTop += 1;
      await (new Promise(resolve => requestAnimationFrame(resolve)));
      assert.equal(firstVisible, 1);
      assert.equal(lastVisible, 3);

      document.body.removeChild(container);
    })
  })
});