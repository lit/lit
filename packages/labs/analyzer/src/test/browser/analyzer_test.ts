import {assert} from '@esm-bundle/chai';
import ts from './typescript.js';
import {InMemoryAnalyzer} from './utils.js';
import {AbsolutePath} from '../../index.js';

suite('Analyzer', () => {
  test('works', () => {
    const elementPath = '/src/test-element.ts' as AbsolutePath;
    const analyzer = new InMemoryAnalyzer({
      typescript: ts,
      lang: 'ts',
      files: {
        [elementPath]: `
      import {LitElement, html, css} from 'lit';
      import {customElement, property} from 'lit/decorators.js';

      @customElement('test-element')
      export class TestElement extends LitElement {
        @property() name = 'World';

        render() {
          return html\`<div>\${this.name}</div>\`;
        }
      }
    `,
        '/package.json': `{
      "name": "test-element",
      "type": "module",
      "dependencies": {
        "lit": "^2.0.0"
      }
    }`,
      },
    });
    const module = analyzer.getModule(elementPath);
    assert.isOk(module);
    assert.equal(module.declarations[0].name, 'TestElement');
  });
});
