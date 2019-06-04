import { LitVirtualizer } from '../lit-virtualizer.js'

describe('<lit-virtualizer>', function () {
  it('is running the tests', function () {
    assert.equal(1 + 1, 2);
  });

  it('registers lit-virtualizer as a custom element', function () {
    const lvs = document.createElement('lit-virtualizer');
    assert.instanceOf(lvs, LitVirtualizer);
  });
});