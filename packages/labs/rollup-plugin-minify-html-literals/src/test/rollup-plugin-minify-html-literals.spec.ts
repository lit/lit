import {test, describe as suite, beforeEach} from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'path';
import {TransformPluginContext} from 'rollup';
import sinon from 'sinon';
import * as minify from '../lib/minify-html-literals.js';
import minifyHTML, {Options} from '../index.js';

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
      ) => minify.Result,
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
});
