/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as pathlib from 'path';
import * as fs from 'fs/promises';
import {fileURLToPath} from 'url';
import {spawn, ChildProcess} from 'child_process';
import stripIndent from 'strip-indent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathlib.dirname(__filename);
const tempRoot = pathlib.resolve(__dirname, '__temp');

/**
 * Normalizes indentation and leading/trailing newlines.
 */
const normalize = (s: string) => stripIndent(s).trim() + '\n';
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

/**
 * Utilities for managing a temporary filesystem and running Eleventy.
 */
class TestRig {
  private readonly _tempDir = pathlib.join(tempRoot, String(Math.random()));
  private readonly _activeChildProcesses = new Set<ChildProcess>();

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
    for (const process of this._activeChildProcesses) {
      process.kill(9);
    }
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

  exec(command: string): {
    kill: (signal: number) => void;
    done: Promise<{code: number; stdout: string; stderr: string}>;
  } {
    const cwd = pathlib.resolve(this._tempDir);
    const child = spawn(command, [], {
      cwd,
      shell: true,
    });
    this._activeChildProcesses.add(child);
    const kill = (code: number) => child.kill(code);
    let stdout = '';
    let stderr = '';
    const showOutput = process.env.SHOW_TEST_OUTPUT;
    const done = new Promise<{code: number; stdout: string; stderr: string}>(
      (resolve) => {
        child.stdout.on('data', (chunk) => {
          stdout += chunk;
          if (showOutput) {
            process.stdout.write(chunk);
          }
        });
        child.stderr.on('data', (chunk) => {
          stderr += chunk;
          if (showOutput) {
            process.stderr.write(chunk);
          }
        });
        child.on('exit', (code) => {
          this._activeChildProcesses.delete(child);
          // Code will be null when the process was killed via a signal. 130 is
          // the conventional return code used to represent this case.
          resolve({code: code ?? 130, stdout, stderr});
        });
      }
    );
    return {done, kill};
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

/**
 * Retry the given function until it returns a promise that resolves, or until
 * the given timeout expires.
 */
const retryUntilTimeElapses = async <T>(
  timeout: number,
  pollInterval: number,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  let lastError: unknown;
  while (performance.now() - start < timeout) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, pollInterval));
    }
  }
  throw lastError ?? new Error('Timed out immediately');
};

/**
 * Retry the given function until it returns a promise that resolves, up to the
 * given number of times.
 */
const retryTimes = async <T>(
  numTries: number,
  fn: () => Promise<T>
): Promise<T> => {
  let lastErr: unknown;
  for (let i = 0; i < numTries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error('Never tried');
};

test('without plugin', async ({rig}) => {
  await rig.write({
    'index.md': `
      # Heading
      <my-element></my-element>
    `,
  });
  assert.equal((await rig.exec('eleventy').done).code, 0);
  assert.equal(
    await rig.read('_site/index.html'),
    normalize(`
      <h1>Heading</h1>
      <p><my-element></my-element></p>
    `)
  );
});

const modes = ['worker', 'vm'] as const;

modes.forEach((mode) => {
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
          mode: '${mode}'
        });
      };
    `,
  };

  const baseCommandToExec =
    (mode === 'vm' ? 'NODE_OPTIONS=--experimental-vm-modules ' : '') +
    'eleventy --config .eleventy.cjs';

  test('basic component in markdown file', async ({rig}) => {
    await rig.write({
      ...myElementDefinitionAndConfig,
      'index.md': `
        # Heading
        <my-element></my-element>
      `,
    });
    assert.equal((await rig.exec(baseCommandToExec).done).code, 0);
    assert.equal(
      await rig.read('_site/index.html'),
      normalize(`
        <h1>Heading</h1>
        <p><my-element><template shadowroot="open" shadowrootmode="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-element></p>
      `)
    );
  });

  if (mode === 'vm') {
    test('fails when --experimental-vm-modules flag is not enabled', async ({
      rig,
    }) => {
      await rig.write({
        ...myElementDefinitionAndConfig,
        'index.md': `
          # Heading
          <my-element></my-element>
        `,
      });
      const {code, stderr} = await rig.exec('eleventy --config .eleventy.cjs')
        .done;
      assert.equal(code, 1);
      assert.match(stderr, '--experimental-vm-modules');
    });
  }

  test('basic component in HTML file', async ({rig}) => {
    await rig.write({
      ...myElementDefinitionAndConfig,
      'index.html': `
        <h1>Heading</h1>
        <my-element></my-element>
      `,
    });
    assert.equal((await rig.exec(baseCommandToExec).done).code, 0);
    assert.equal(
      await rig.read('_site/index.html'),
      normalize(`
        <h1>Heading</h1>
        <my-element><template shadowroot="open" shadowrootmode="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-element>
      `)
    );
  });

  test('basic component in HTML file with doctype, html, body', async ({
    rig,
  }) => {
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
    assert.equal((await rig.exec(baseCommandToExec).done).code, 0);
    assert.equal(
      await rig.read('_site/index.html'),
      normalize(`
        <!doctype html>
        <html>
          <body>
            <h1>Heading</h1>
            <my-element><template shadowroot="open" shadowrootmode="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-element>
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
            mode: '${mode}',
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
    assert.equal((await rig.exec(baseCommandToExec).done).code, 0);
    assert.equal(
      await rig.read('_site/index.html'),
      normalize(`
        <h1>Heading 1</h1>
        <my-container><template shadowroot="open" shadowrootmode="open"><!--lit-part Pz0gobCCM4E=--><slot></slot><!--/lit-part--></template>
          <my-content><template shadowroot="open" shadowrootmode="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-content>
        </my-container>
        <h1>Heading 2</h1>
        <p><my-container><template shadowroot="open" shadowrootmode="open"><!--lit-part Pz0gobCCM4E=--><slot></slot><!--/lit-part--></template></my-container></p>
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
            mode: '${mode}',
          });
        };
      `,
    });
    assert.equal((await rig.exec(baseCommandToExec).done).code, 0);
    // TODO(aomarks) There should be an error message about missing components.
    assert.equal(
      await rig.read('_site/index.html'),
      normalize(`
        <h1>Heading</h1>
        <p><my-element></my-element></p>
      `)
    );
  });

  test.skip('watch mode', async ({rig}) => {
    await rig.write({
      // eleventy config
      '.eleventy.cjs': `
        const litPlugin = require('@lit-labs/eleventy-plugin');
        module.exports = function (eleventyConfig) {
          eleventyConfig.addPlugin(litPlugin, {
            componentModules: ['./js/my-element.js'],
            mode: '${mode}',
          });
          eleventyConfig.addWatchTarget('js/my-element.js');
        };
      `,

      // markdown
      'index.md': `
        # Heading
        <my-element></my-element>
      `,

      // initial component definition
      'js/my-element.js': `
        import { html, LitElement } from 'lit';
        class MyElement extends LitElement {
          render() {
            return html\`INITIAL\`;
          }
        }
        customElements.define('my-element', MyElement);
      `,
    });

    const {kill, done} = rig.exec(baseCommandToExec + ' --watch');

    // It will take Eleventy some unknown amount of time to notice the change and
    // write new output. Just poll until we find the expected output.
    await retryUntilTimeElapses(10000, 100, async () => {
      assert.equal(
        await rig.read('_site/index.html'),
        normalize(`
          <h1>Heading</h1>
          <p><my-element><template shadowroot="open" shadowrootmode="open"><!--lit-part QMmCfL7Whws=-->INITIAL<!--/lit-part--></template></my-element></p>
        `)
      );
    });

    // Eleventy occasionally doesn't notice when a file has changed (maybe 5% of
    // the time). Maybe there is a race condition in Eleventy's watch logic?
    // Re-write the file a few times to deflake this.
    await retryTimes(3, async () => {
      await rig.write({
        // updated component definition
        'js/my-element.js': `
          import { html, LitElement } from 'lit';
          class MyElement extends LitElement {
            render() {
              return html\`UPDATED\`;
            }
          }
          customElements.define('my-element', MyElement);
        `,
      });

      await retryUntilTimeElapses(1000, 100, async () => {
        assert.equal(
          await rig.read('_site/index.html'),
          normalize(`
            <h1>Heading</h1>
            <p><my-element><template shadowroot="open" shadowrootmode="open"><!--lit-part JDaFfBEPiAs=-->UPDATED<!--/lit-part--></template></my-element></p>
          `)
        );
      });
    });

    kill(/* SIGINT */ 2);
    assert.equal((await done).code, 0);
  });

  test('multiple component modules in HTML file', async ({rig}) => {
    await rig.write({
      // eleventy config
      '.eleventy.cjs': `
        const litPlugin = require('@lit-labs/eleventy-plugin');
        module.exports = function (eleventyConfig) {
          eleventyConfig.addPlugin(litPlugin, {
            componentModules: [
              './js/my-element-1.js',
              './js/my-element-2.js',
            ],
          });
        };
      `,

      // component definition 1
      'js/my-element-1.js': `
        import { html, LitElement } from 'lit';
        class MyElement1 extends LitElement {
          render() {
            return html\`<b>shadow content 1</b>\`;
          }
        }
        customElements.define('my-element-1', MyElement1);
      `,

      // component definition 2
      'js/my-element-2.js': `
        import { html, LitElement } from 'lit';
        class MyElement2 extends LitElement {
          render() {
            return html\`<b>shadow content 2</b>\`;
          }
        }
        customElements.define('my-element-2', MyElement2);
      `,

      // HTML
      'index.html': `
        <h1>Heading</h1>
        <my-element-1></my-element-1>
        <my-element-2></my-element-2>
      `,
    });
    assert.equal((await rig.exec(baseCommandToExec).done).code, 0);
    assert.equal(
      await rig.read('_site/index.html'),
      normalize(`
        <h1>Heading</h1>
        <my-element-1><template shadowroot="open" shadowrootmode="open"><!--lit-part wBkDjDE4LIw=--><b>shadow content 1</b><!--/lit-part--></template></my-element-1>
        <my-element-2><template shadowroot="open" shadowrootmode="open"><!--lit-part gxUDjDE4LIw=--><b>shadow content 2</b><!--/lit-part--></template></my-element-2>
      `)
    );
  });

  test('multiple pages', async ({rig}) => {
    const files: {[path: string]: string} = {...myElementDefinitionAndConfig};
    for (let i = 1; i <= 25; i++) {
      files[`page${i}.md`] = `
        # Page ${i}
        <my-element></my-element>
      `;
    }
    await rig.write(files);
    assert.equal((await rig.exec(baseCommandToExec).done).code, 0);
    for (let i = 1; i <= 25; i++) {
      assert.equal(
        await rig.read(`_site/page${i}/index.html`),
        normalize(`
          <h1>Page ${i}</h1>
          <p><my-element><template shadowroot="open" shadowrootmode="open"><!--lit-part 8dHorjH6jDo=--><b>shadow content</b><!--/lit-part--></template></my-element></p>
        `)
      );
    }
  });

  test('template files with `permalink: false` in frontmatter', async ({
    rig,
  }) => {
    await rig.write({
      ...myElementDefinitionAndConfig,
      // md
      'index.md': `
        ---
        permalink: false
        ---
        # Heading
        <my-element></my-element>
      `,
    });

    const {kill, done} = rig.exec(baseCommandToExec);
    const timeout = 30_000;
    await Promise.race([
      done.then(({code}) => assert.equal(code, 0)),
      sleep(timeout).then(() => {
        kill(/* SIGINT */ 2);
        assert.not(true, `11ty process didn't exit in ${timeout}ms.`);
      }),
    ]);
  });
});

test.run();
