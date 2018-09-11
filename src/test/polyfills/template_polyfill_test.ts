const assert = chai.assert;

suite('Template', function() {
  let template: HTMLTemplateElement;

  suiteSetup(() => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    template = document.createElement('template');
    template.innerHTML = '<span id="content">Hello World!</span>';
    container.appendChild(template);
  });

  test('No rendering', () => {
    const bcr = template.getBoundingClientRect();
    assert.equal(bcr.height, 0);
    assert.equal(bcr.width, 0);
  });

  test('content', function() {
    assert.equal(template.childNodes.length, 0, 'template children evacipated');
    assert.isDefined(template.content, 'template content exists');
    assert.equal(
      template.content.childNodes.length,
      3,
      'template content has expected number of nodes'
    );
    assert.isNull(
      document.querySelector('#content'),
      'template content not in document'
    );
  });
});
