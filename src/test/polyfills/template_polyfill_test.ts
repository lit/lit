import {policy} from '../test-utils/security.js';

const assert = chai.assert;

suite('Template', function() {
  let template: HTMLTemplateElement;

  suiteSetup(() => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    template = document.createElement('template');
    template.innerHTML =
        policy.createHTML('<span id="content">Hello World!</span>');
    container.appendChild(template);
  });

  test('No rendering', () => {
    const bcr = template.getBoundingClientRect();
    assert.equal(bcr.height, 0);
  });

  test('content', function() {
    assert.equal(template.childNodes.length, 0, 'template children evacipated');
    assert.isDefined(template.content, 'template content exists');
    assert.equal(
        template.content.childNodes.length,
        1,
        'template content has expected number of nodes');
    assert.isNull(
        document.querySelector('#content'), 'template content not in document');
  });

  test('stamping', function() {
    document.body.appendChild(document.importNode(template.content, true));
    const content = document.querySelector('#content');
    assert.isDefined(content, 'template content stamped into document');
  });

  test('innerHTML', function() {
    const imp = document.createElement('template');
    let s = 'pre<div>Hi</div><div>Bye</div>post';
    imp.innerHTML = policy.createHTML(s);
    assert.equal(imp.content.childNodes.length, 4);
    assert.equal(imp.content.firstChild!.textContent, 'pre');
    s = 'foo';
    imp.innerHTML = policy.createHTML(s);
    assert.equal(imp.content.childNodes.length, 1);
    assert.equal(imp.content.firstChild!.textContent, s);
  });
});
