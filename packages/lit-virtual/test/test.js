import { LitVirtualScroller } from '../lit-virtual.js'

describe('<lit-virtual-scroller>', function () {
  it('is running the tests', function () {
    assert.equal(1 + 1, 2);
  });

  it('registers lit-virtual-scroller as a custom element', function () {
    const lvs = document.createElement('lit-virtual-scroller');
    assert.instanceOf(lvs, LitVirtualScroller);
  });
});