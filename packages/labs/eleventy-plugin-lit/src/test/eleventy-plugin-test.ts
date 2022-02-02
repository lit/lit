/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
import * as assert from 'uvu/assert';
import * as pathlib from 'path';
import * as fs from 'fs/promises';
import {fileURLToPath} from 'url';
import {spawn} from 'child_process';
import stripIndent from 'strip-indent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathlib.dirname(__filename);
const tempRoot = pathlib.resolve(__dirname, '__temp');

/**
 * Normalizes indentation and leading/trailing newlines.
 */
const normalize = (s: string) => stripIndent(s).trim() + '\n';

/**
 * Utilities for managing a temporary filesystem and running Eleventy.
 */
class TestRig {
  private readonly _tempDir = pathlib.join(tempRoot, String(Math.random()));

  async setup() {
    // Simulate installing @lit-labs/eleventy-plugin with a symlink to the root
    // of this package.
    await fs.mkdir(pathlib.join(this._tempDir, 'node_modules', '@lit-labs'), {
      recursive: true,
    });
    // The root of the @lit-labs/eleventy-plugin package is 5 levels up from our
    // temp directory.
    await fs.symlink(
      '../../../../..',
      pathlib.join(
        this._tempDir,
        'node_modules',
        '@lit-labs',
        'eleventy-plugin'
      )
    );
  }

  async cleanup() {
    await fs.rm(this._tempDir, {recursive: true});
  }

  async write(files: {[path: string]: string}) {
    await Promise.all(
      Object.entries(files).map(async ([relative, data]) => {
        const absolute = pathlib.resolve(this._tempDir, relative);
        await fs.mkdir(pathlib.dirname(absolute), {recursive: true});
        return fs.writeFile(absolute, normalize(data), 'utf8');
      })
    );
  }

  async read(path: string): Promise<string> {
    const absolute = pathlib.resolve(this._tempDir, path);
    return normalize(await fs.readFile(absolute, 'utf8'));
  }

  exec(command: string): Promise<{code: number}> {
    const cwd = pathlib.resolve(this._tempDir);
    const child = spawn(command, [], {
      cwd,
      shell: true,
      stdio: 'inherit',
    });
    return new Promise((resolve) => {
      child.on('exit', (code) => {
        // Code will be null when the process was killed via a signal. 130 is
        // the conventional return code used to represent this case.
        resolve({code: code ?? 130});
      });
    });
  }
}

const test = suite<{rig: TestRig}>();

test.before.each(async (ctx) => {
  ctx.rig = new TestRig();
  await ctx.rig.setup();
});

test.after.each(async ({rig}) => {
  await rig.cleanup();
});

test('without plugin', async ({rig}) => {
  await rig.write({
    'index.md': `
      # Heading
      <my-element></my-element>
    `,
  });
  assert.equal((await rig.exec('eleventy')).code, 0);
  assert.equal(
    await rig.read('_site/index.html'),
    normalize(`
      <h1>Heading</h1>
      <p><my-element></my-element></p>
    `)
  );
});

const myElementDefinitionAndConfig = {
  // component definition
  'js/my-element.js': `
    import { html, LitElement } from 'lit';
    class MyElement extends LitElement {
      render() {
        return html\`<b>shadow content</b>\`;
      }
    }
    customElements.define('my-element', MyElement);
  `,

  // eleventy config
  '.eleventy.cjs': `
    const litPlugin = require('@lit-labs/eleventy-plugin');
    module.exports = function (eleventyConfig) {
      eleventyConfig.addPlugin(litPlugin, {
        componentModules: ['./js/my-element.js'],
      });
    };
  `,
};

test('basic component in markdown file', async ({rig}) => {
  await rig.write({
    ...myElementDefinitionAndConfig,
    'index.md': `
      # Heading
      <my-element></my-element>
    `,
  });
  assert.equal((await rig.exec('eleventy --config .eleventy.cjs')).code, 0);
  assert.equal(
    await rig.read('_site/index.html'),
    normalize(`
      <h1>Heading</h1>
      <p><my-element><template shadowroot="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-element></p>
    `)
  );
});

test('basic component in HTML file', async ({rig}) => {
  await rig.write({
    ...myElementDefinitionAndConfig,
    'index.html': `
      <h1>Heading</h1>
      <my-element></my-element>
    `,
  });
  assert.equal((await rig.exec('eleventy --config .eleventy.cjs')).code, 0);
  assert.equal(
    await rig.read('_site/index.html'),
    normalize(`
      <h1>Heading</h1>
      <my-element><template shadowroot="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-element>
    `)
  );
});

test('basic component in HTML file with doctype, html, body', async ({rig}) => {
  await rig.write({
    ...myElementDefinitionAndConfig,
    'index.html': `
      <!doctype html>
      <html>
        <body>
          <h1>Heading</h1>
          <my-element></my-element>
        </body>
      </html>
    `,
  });
  assert.equal((await rig.exec('eleventy --config .eleventy.cjs')).code, 0);
  assert.equal(
    await rig.read('_site/index.html'),
    normalize(`
      <!doctype html>
      <html>
        <body>
          <h1>Heading</h1>
          <my-element><template shadowroot="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-element>
        </body>
      </html>
    `)
  );
});

test('2 containers, 1 slotted child', async ({rig}) => {
  await rig.write({
    // md
    'index.md': `
      # Heading 1
      <my-container>
        <my-content></my-content>
      </my-container>

      # Heading 2
      <my-container></my-container>
    `,

    // config
    '.eleventy.cjs': `
      const litPlugin = require('@lit-labs/eleventy-plugin');
      module.exports = function (eleventyConfig) {
        eleventyConfig.addPlugin(litPlugin, {
          componentModules: ['./js/my-element.js'],
        });
      };
    `,

    // js
    'js/my-element.js': `
      import { html, LitElement } from 'lit';

      class MyContainer extends LitElement {
        render() {
          return html\`<slot></slot>\`;
        }
      }
      customElements.define('my-container', MyContainer);

      class MyContent extends LitElement {
        render() {
          return html\`<b>shadow content</b>\`;
        }
      }
      customElements.define('my-content', MyContent);
    `,
  });
  assert.equal((await rig.exec('eleventy --config .eleventy.cjs')).code, 0);
  assert.equal(
    await rig.read('_site/index.html'),
    normalize(`
      <h1>Heading 1</h1>
      <my-container><template shadowroot="open"><!--lit-part Pz0gobCCM4E=--><slot></slot><!--/lit-part--></template>
        <my-content><template shadowroot="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-content>
      </my-container>
      <h1>Heading 2</h1>
      <p><my-container><template shadowroot="open"><!--lit-part Pz0gobCCM4E=--><slot></slot><!--/lit-part--></template></my-container></p>
    `)
  );
});

test('missing component definition', async ({rig}) => {
  await rig.write({
    // md
    'index.md': `
      # Heading
      <my-element></my-element>
    `,

    // config
    '.eleventy.cjs': `
      const litPlugin = require('@lit-labs/eleventy-plugin');
      module.exports = function (eleventyConfig) {
        eleventyConfig.addPlugin(litPlugin, {
          componentModules: [],
        });
      };
    `,
  });
  assert.equal((await rig.exec('eleventy --config .eleventy.cjs')).code, 0);
  // TODO(aomarks) There should be an error message about missing components.
  assert.equal(
    await rig.read('_site/index.html'),
    normalize(`
      <h1>Heading</h1>
      <p><my-element></my-element></p>
    `)
  );
});

test.run();
