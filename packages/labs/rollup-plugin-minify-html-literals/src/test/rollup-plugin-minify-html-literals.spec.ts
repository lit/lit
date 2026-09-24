import * as assert from 'node:assert/strict';
import {beforeEach, describe as suite, test} from 'node:test';
import * as path from 'path';
import {TransformPluginContext} from 'rollup';
import sinon from 'sinon';
import minifyHTML, {Options} from '../index.js';
import * as minify from '../lib/minify-html-literals.js';

suite('rollup-plugin-minify-html-literals', () => {
  const fileName = path.resolve('test.js');
  let context: {warn: sinon.SinonSpy; error: sinon.SinonSpy};
  beforeEach(() => {
    context = {
      warn: sinon.spy(),
      error: sinon.spy(),
    };
  });

  test('should return a plugin with a transform function', () => {
    const plugin = minifyHTML();
    assert.equal(typeof plugin, 'object');
    assert.equal(typeof plugin.name, 'string');
    assert.equal(typeof plugin.transform, 'function');
  });

  test('should call minifyHTMLLiterals()', () => {
    const options: Options = {};
    const plugin = minifyHTML(options);
    assert.equal(typeof options.minifyHTMLLiterals, 'function');
    const minifySpy = sinon.spy(options, 'minifyHTMLLiterals');
    plugin.transform.apply(context as unknown as TransformPluginContext, [
      'return',
      fileName,
    ]);
    assert.ok(minifySpy.called);
  });

  test('should pass id and options to minifyHTMLLiterals()', () => {
    const options: Options = {
      options: {
        minifyOptions: {
          minifyCSS: false,
        },
      },
    };

    const plugin = minifyHTML(options);
    const minifySpy = sinon.spy(options, 'minifyHTMLLiterals');
    plugin.transform.apply(context as unknown as TransformPluginContext, [
      'return',
      fileName,
    ]);
    assert.ok(
      minifySpy.calledWithMatch(
        sinon.match.string,
        sinon.match({
          fileName,
          minifyOptions: {
            minifyCSS: false,
          },
        })
      )
    );
  });

  test('should allow custom minifyHTMLLiterals', () => {
    const customMinify = sinon.spy(
      (source: string, options: minify.Options) => {
        return minify.minifyHTMLLiterals(source, options);
      }
    );

    const plugin = minifyHTML({
      minifyHTMLLiterals: customMinify as (
        source: string,
        options?: minify.DefaultOptions | undefined
      ) => Promise<minify.Result | null>,
    });

    plugin.transform.apply(context as unknown as TransformPluginContext, [
      'return',
      fileName,
    ]);
    assert.ok(customMinify.called);
  });

  test('should warn errors', () => {
    const plugin = minifyHTML({
      minifyHTMLLiterals: () => {
        throw new Error('failed');
      },
    });

    plugin.transform.apply(context as unknown as TransformPluginContext, [
      'return',
      fileName,
    ]);
    assert.ok(context.warn.calledWith('failed'));
    assert.equal(context.error.called, false);
  });

  test('should fail is failOnError is true', () => {
    const plugin = minifyHTML({
      minifyHTMLLiterals: () => {
        throw new Error('failed');
      },
      failOnError: true,
    });

    plugin.transform.apply(context as unknown as TransformPluginContext, [
      'return',
      fileName,
    ]);
    assert.ok(context.error.calledWith('failed'));
    assert.equal(context.warn.called, false);
  });

  test('should filter ids', () => {
    let options: Options = {};
    minifyHTML(options);
    assert.equal(typeof options.filter, 'function');
    assert.ok(options.filter!(fileName));
    options = {
      include: '*.ts',
    };

    minifyHTML(options);
    assert.equal(typeof options.filter, 'function');
    assert.equal(options.filter!(fileName), false);
    assert.ok(options.filter!(path.resolve('test.ts')));
  });

  test('should allow custom filter', () => {
    const options = {
      filter: sinon.spy(() => false),
    };

    const plugin = minifyHTML(options);
    plugin.transform.apply(context as unknown as TransformPluginContext, [
      'return',
      fileName,
    ]);
    assert.ok(options.filter.calledWith());
  });

  test('should minify CSS by default', async () => {
    const source = `
      const styles = css\`
        .container {
          display: flex;
          color: blue;
        }
      \`;
    `;

    const plugin = minifyHTML();

    const result = await plugin.transform.apply(
      context as unknown as TransformPluginContext,
      [source, fileName]
    );

    // Should minify CSS by default
    assert.ok(result);
    assert.ok(typeof result === 'object');
    // Should remove whitespace and minify (LightningCSS orders properties)
    assert.ok(result!.code!.includes('.container{color:#00f;display:flex}'));
  });

  test('should not minify CSS when minifyCSS is false', async () => {
    const source = `
      const styles = css\`
        .container {
          display: flex;
          color: blue;
        }
      \`;
    `;

    const plugin = minifyHTML({
      options: {
        minifyOptions: {
          minifyCSS: false,
        },
      },
    });

    const result = await plugin.transform.apply(
      context as unknown as TransformPluginContext,
      [source, fileName]
    );

    // When minifyCSS is false, CSS-only templates won't be processed
    // so result will be null (no changes needed)
    assert.equal(result, null);
  });

  test('Passing LightningCSS options should affect the minified output', async () => {
    const source = `
      const styles = css\`
        @custom-media --small (max-width: 768px);
        
        .container {
          color: blue;
        }
        
        @media (--small) {
          .container {
            color: red;
          }
        }
      \`;
    `;

    // Enable draft features - @custom-media requires this flag
    const plugin = minifyHTML({
      options: {
        minifyOptions: {
          minifyCSS: {
            minify: true,
            drafts: {
              customMedia: true,
            },
          },
        },
      },
    });

    const result = await plugin.transform.apply(
      context as unknown as TransformPluginContext,
      [source, fileName]
    );

    // Should minify and transform with custom options
    assert.ok(result);
    assert.ok(typeof result === 'object');

    // Should minify (whitespace removed)
    assert.ok(result!.code!.includes('.container{'));

    // @custom-media should be preserved (drafts.customMedia enabled)
    assert.ok(result!.code!.includes('@custom-media'));
    assert.ok(result!.code!.includes('--small'));

    // Media query should use the custom media query name
    assert.ok(result!.code!.includes('@media (--small)'));

    // Colors should be minified
    assert.ok(result!.code!.includes('#00f'));
  });
});
