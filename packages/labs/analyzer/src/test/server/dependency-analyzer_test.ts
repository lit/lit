/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as assert from 'node:assert';
import {describe as suite, test} from 'node:test';
import * as path from 'path';
import {parseCustomElementsManifest} from '../../lib/cem-reader.js';
import {
  DependencyAnalyzer,
  DependencyFs,
  DependencyPath,
} from '../../lib/dependency-analyzer.js';
import {InMemoryAnalyzer} from './utils.js';

/**
 * Creates a mock filesystem backed by a Record of normalized paths → content.
 */
const createMockFs = (files: Record<string, string>): DependencyFs => ({
  readFile: (p: string) => files[path.normalize(p)],
});

const mockPath: DependencyPath = path;

suite('CEM Reader', () => {
  test('parses a basic CEM with tag name on declaration', () => {
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/my-element.js',
          declarations: [
            {
              kind: 'class',
              name: 'MyElement',
              customElement: true,
              tagName: 'my-element',
              description: 'A test element',
              members: [
                {
                  kind: 'field',
                  name: 'label',
                  type: {text: 'string'},
                  default: "'hello'",
                  description: 'The label text',
                  attribute: 'label',
                  reflects: true,
                },
                {
                  kind: 'field',
                  name: '_internal',
                  privacy: 'private',
                  type: {text: 'number'},
                },
                {
                  kind: 'field',
                  name: 'count',
                  type: {text: 'number'},
                  static: true,
                },
              ],
              attributes: [
                {
                  name: 'label',
                  type: {text: 'string'},
                  default: "'hello'",
                  fieldName: 'label',
                },
              ],
              events: [
                {
                  name: 'label-changed',
                  type: {text: 'CustomEvent'},
                  description: 'Fired when label changes',
                },
              ],
            },
          ],
          exports: [
            {
              kind: 'js',
              name: 'MyElement',
              declaration: {name: 'MyElement', module: 'src/my-element.js'},
            },
          ],
        },
      ],
    });

    const elements = parseCustomElementsManifest(cem, '@test/pkg');
    assert.equal(elements.length, 1);

    const el = elements[0];
    assert.equal(el.tagName, 'my-element');
    assert.equal(el.className, 'MyElement');
    assert.equal(el.packageName, '@test/pkg');
    assert.equal(el.modulePath, 'src/my-element.js');
    assert.equal(el.description, 'A test element');
    assert.equal(el.source, 'cem');

    // Only public non-static fields become properties
    assert.equal(el.properties.size, 1);
    const labelProp = el.properties.get('label');
    assert.ok(labelProp);
    assert.equal(labelProp.type, 'string');
    assert.equal(labelProp.attribute, 'label');
    assert.equal(labelProp.reflects, true);

    // Attributes
    assert.equal(el.attributes.size, 1);
    const labelAttr = el.attributes.get('label');
    assert.ok(labelAttr);
    assert.equal(labelAttr.fieldName, 'label');

    // Events
    assert.equal(el.events.size, 1);
    const event = el.events.get('label-changed');
    assert.ok(event);
    assert.equal(event.type, 'CustomEvent');
  });

  test('resolves tag name from custom-element-definition exports', () => {
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/fancy-button.js',
          declarations: [
            {
              kind: 'class',
              name: 'FancyButton',
              customElement: true,
              // No tagName on declaration — resolved from exports
            },
          ],
          exports: [
            {
              kind: 'custom-element-definition',
              name: 'fancy-button',
              declaration: {
                name: 'FancyButton',
                module: 'src/fancy-button.js',
              },
            },
          ],
        },
      ],
    });

    const elements = parseCustomElementsManifest(cem, '@test/buttons');
    assert.equal(elements.length, 1);
    assert.equal(elements[0].tagName, 'fancy-button');
    assert.equal(elements[0].className, 'FancyButton');
  });

  test('skips non-custom-element classes', () => {
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/utils.js',
          declarations: [
            {
              kind: 'class',
              name: 'UtilityClass',
              // customElement is not set
            },
            {
              kind: 'variable',
              name: 'VERSION',
            },
          ],
        },
      ],
    });

    const elements = parseCustomElementsManifest(cem, '@test/utils');
    assert.equal(elements.length, 0);
  });

  test('handles invalid JSON gracefully', () => {
    const elements = parseCustomElementsManifest('not valid json', '@test/bad');
    assert.equal(elements.length, 0);
  });

  test('handles manifest with no modules', () => {
    const cem = JSON.stringify({schemaVersion: '1.0.0'});
    const elements = parseCustomElementsManifest(cem, '@test/empty');
    assert.equal(elements.length, 0);
  });

  test('parses multiple elements across modules', () => {
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/element-a.js',
          declarations: [
            {
              kind: 'class',
              name: 'ElementA',
              customElement: true,
              tagName: 'element-a',
            },
          ],
        },
        {
          kind: 'javascript-module',
          path: 'src/element-b.js',
          declarations: [
            {
              kind: 'class',
              name: 'ElementB',
              customElement: true,
              tagName: 'element-b',
            },
          ],
        },
      ],
    });

    const elements = parseCustomElementsManifest(cem, '@test/multi');
    assert.equal(elements.length, 2);
    assert.equal(elements[0].tagName, 'element-a');
    assert.equal(elements[1].tagName, 'element-b');
  });
});

suite('DependencyAnalyzer', () => {
  test('analyzes package with CEM', () => {
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/my-widget.js',
          declarations: [
            {
              kind: 'class',
              name: 'MyWidget',
              customElement: true,
              tagName: 'my-widget',
              description: 'A widget element',
              members: [
                {
                  kind: 'field',
                  name: 'size',
                  type: {text: 'number'},
                  default: '16',
                },
              ],
            },
          ],
        },
      ],
    });

    const files: Record<string, string> = {};
    files[path.normalize('/packages/my-widget/package.json')] = JSON.stringify({
      name: '@test/my-widget',
      version: '1.0.0',
    });
    files[path.normalize('/packages/my-widget/custom-elements.json')] = cem;

    const analyzer = new DependencyAnalyzer(createMockFs(files), mockPath);

    const elements = analyzer.analyzePackage('/packages/my-widget');
    assert.equal(elements.length, 1);
    assert.equal(elements[0].tagName, 'my-widget');
    assert.equal(elements[0].source, 'cem');
    assert.equal(elements[0].properties.get('size')?.type, 'number');
  });

  test('falls back to compiled analysis when no CEM', () => {
    const jsContent = `
      class MyButton extends HTMLElement {}
      customElements.define('my-button', MyButton);
    `;

    const files: Record<string, string> = {};
    files[path.normalize('/packages/my-button/package.json')] = JSON.stringify({
      name: '@test/my-button',
      version: '2.0.0',
      module: 'index.js',
    });
    files[path.normalize('/packages/my-button/index.js')] = jsContent;

    const analyzer = new DependencyAnalyzer(createMockFs(files), mockPath);

    const elements = analyzer.analyzePackage('/packages/my-button');
    assert.equal(elements.length, 1);
    assert.equal(elements[0].tagName, 'my-button');
    assert.equal(elements[0].className, 'MyButton');
    assert.equal(elements[0].source, 'compiled');
  });

  test('caches results by package name and version', () => {
    let cemReadCount = 0;
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/cached-el.js',
          declarations: [
            {
              kind: 'class',
              name: 'CachedEl',
              customElement: true,
              tagName: 'cached-el',
            },
          ],
        },
      ],
    });

    const files: Record<string, string> = {};
    const pkgJsonPath = path.normalize('/pkg/package.json');
    const cemPath = path.normalize('/pkg/custom-elements.json');
    files[pkgJsonPath] = JSON.stringify({
      name: '@test/cached',
      version: '1.0.0',
    });
    files[cemPath] = cem;

    const countingFs: DependencyFs = {
      readFile: (p: string) => {
        const normalized = path.normalize(p);
        if (normalized === cemPath) {
          cemReadCount++;
        }
        return files[normalized];
      },
    };

    const analyzer = new DependencyAnalyzer(countingFs, mockPath);

    const first = analyzer.analyzePackage('/pkg');
    assert.equal(cemReadCount, 1, 'CEM should be read once on first call');
    const second = analyzer.analyzePackage('/pkg');

    // CEM should not be re-read on cached second call
    assert.equal(cemReadCount, 1, 'CEM should not be re-read from cache');
    assert.deepStrictEqual(first, second);
  });

  test('getCustomElement returns element by tag name', () => {
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/lookup-el.js',
          declarations: [
            {
              kind: 'class',
              name: 'LookupEl',
              customElement: true,
              tagName: 'lookup-el',
              description: 'An element for lookup tests',
            },
          ],
        },
      ],
    });

    const files: Record<string, string> = {};
    files[path.normalize('/pkg/package.json')] = JSON.stringify({
      name: '@test/lookup',
      version: '1.0.0',
    });
    files[path.normalize('/pkg/custom-elements.json')] = cem;

    const analyzer = new DependencyAnalyzer(createMockFs(files), mockPath);

    // Before analysis, element is not in registry
    assert.equal(analyzer.getCustomElement('lookup-el'), undefined);

    analyzer.analyzePackage('/pkg');

    // After analysis, element is findable by tag name
    const el = analyzer.getCustomElement('lookup-el');
    assert.ok(el);
    assert.equal(el.tagName, 'lookup-el');
    assert.equal(el.description, 'An element for lookup tests');
  });

  test('getAllCustomElements returns all discovered elements', () => {
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/el-one.js',
          declarations: [
            {
              kind: 'class',
              name: 'ElOne',
              customElement: true,
              tagName: 'el-one',
            },
          ],
        },
        {
          kind: 'javascript-module',
          path: 'src/el-two.js',
          declarations: [
            {
              kind: 'class',
              name: 'ElTwo',
              customElement: true,
              tagName: 'el-two',
            },
          ],
        },
      ],
    });

    const files: Record<string, string> = {};
    files[path.normalize('/pkg/package.json')] = JSON.stringify({
      name: '@test/multi',
      version: '1.0.0',
    });
    files[path.normalize('/pkg/custom-elements.json')] = cem;

    const analyzer = new DependencyAnalyzer(createMockFs(files), mockPath);
    analyzer.analyzePackage('/pkg');

    const all = analyzer.getAllCustomElements();
    assert.equal(all.length, 2);
    const tagNames = all.map((e) => e.tagName).sort();
    assert.deepStrictEqual(tagNames, ['el-one', 'el-two']);
  });

  test('handles missing package.json', () => {
    const analyzer = new DependencyAnalyzer(
      {readFile: () => undefined},
      mockPath
    );

    const elements = analyzer.analyzePackage('/nonexistent');
    assert.equal(elements.length, 0);
  });

  test('respects customElements field in package.json for CEM path', () => {
    const cem = JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/custom-path-el.js',
          declarations: [
            {
              kind: 'class',
              name: 'CustomPathEl',
              customElement: true,
              tagName: 'custom-path-el',
            },
          ],
        },
      ],
    });

    const files: Record<string, string> = {};
    files[path.normalize('/pkg/package.json')] = JSON.stringify({
      name: '@test/custom-path',
      version: '1.0.0',
      customElements: 'dist/elements.json',
    });
    files[path.normalize('/pkg/dist/elements.json')] = cem;

    const analyzer = new DependencyAnalyzer(createMockFs(files), mockPath);

    const elements = analyzer.analyzePackage('/pkg');
    assert.equal(elements.length, 1);
    assert.equal(elements[0].tagName, 'custom-path-el');
  });
});

suite('Analyzer dependency integration', () => {
  test('Analyzer exposes dependencyAnalyzer', () => {
    const analyzer = new InMemoryAnalyzer('js', {
      '/package.json': JSON.stringify({name: '@test/dep-integration'}),
    });
    assert.ok(analyzer.dependencyAnalyzer);
    assert.ok(analyzer.dependencyAnalyzer instanceof DependencyAnalyzer);
  });

  test('getDependencyCustomElement returns undefined for unknown tags', () => {
    const analyzer = new InMemoryAnalyzer('js', {
      '/package.json': JSON.stringify({name: '@test/dep-unknown'}),
    });
    assert.equal(
      analyzer.getDependencyCustomElement('nonexistent-element'),
      undefined
    );
  });
});
