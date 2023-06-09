import { expect } from 'chai';
import * as minify from 'minify-html-literals';
import * as path from 'path';
import { TransformPluginContext } from 'rollup';
import { match, SinonSpy, spy } from 'sinon';
import minifyHTML, { Options } from '../index';

describe('minify-html-literals', () => {
  const fileName = path.resolve('test.js');
  let context: { warn: SinonSpy; error: SinonSpy };
  beforeEach(() => {
    context = {
      warn: spy(),
      error: spy()
    };
  });

  it('should return a plugin with a transform function', () => {
    const plugin = minifyHTML();
    expect(plugin).to.be.an('object');
    expect(plugin.name).to.be.a('string');
    expect(plugin.transform).to.be.a('function');
  });

  it('should call minifyHTMLLiterals()', () => {
    const options: Options = {};
    const plugin = minifyHTML(options);
    expect(options.minifyHTMLLiterals).to.be.a('function');
    const minifySpy = spy(options, 'minifyHTMLLiterals');
    plugin.transform.apply((context as unknown) as TransformPluginContext, [
      'return',
      fileName
    ]);
    expect(minifySpy.called).to.be.true;
  });

  it('should pass id and options to minifyHTMLLiterals()', () => {
    const options: Options = {
      options: {
        minifyOptions: {
          minifyCSS: false
        }
      }
    };

    const plugin = minifyHTML(options);
    const minifySpy = spy(options, 'minifyHTMLLiterals');
    plugin.transform.apply((context as unknown) as TransformPluginContext, [
      'return',
      fileName
    ]);
    expect(
      minifySpy.calledWithMatch(
        match.string,
        match({
          fileName,
          minifyOptions: {
            minifyCSS: false
          }
        })
      )
    ).to.be.true;
  });

  it('should allow custom minifyHTMLLiterals', () => {
    const customMinify = spy((source: string, options: minify.Options) => {
      return minify.minifyHTMLLiterals(source, options);
    });

    const plugin = minifyHTML({
      minifyHTMLLiterals: customMinify
    });

    plugin.transform.apply((context as unknown) as TransformPluginContext, [
      'return',
      fileName
    ]);
    expect(customMinify.called).to.be.true;
  });

  it('should warn errors', () => {
    const plugin = minifyHTML({
      minifyHTMLLiterals: () => {
        throw new Error('failed');
      }
    });

    plugin.transform.apply((context as unknown) as TransformPluginContext, [
      'return',
      fileName
    ]);
    expect(context.warn.calledWith('failed')).to.be.true;
    expect(context.error.called).to.be.false;
  });

  it('should fail is failOnError is true', () => {
    const plugin = minifyHTML({
      minifyHTMLLiterals: () => {
        throw new Error('failed');
      },
      failOnError: true
    });

    plugin.transform.apply((context as unknown) as TransformPluginContext, [
      'return',
      fileName
    ]);
    expect(context.error.calledWith('failed')).to.be.true;
    expect(context.warn.called).to.be.false;
  });

  it('should filter ids', () => {
    let options: Options = {};
    minifyHTML(options);
    expect(options.filter).to.be.a('function');
    expect(options.filter!(fileName)).to.be.true;
    options = {
      include: '*.ts'
    };

    minifyHTML(options);
    expect(options.filter).to.be.a('function');
    expect(options.filter!(fileName)).to.be.false;
    expect(options.filter!(path.resolve('test.ts'))).to.be.true;
  });

  it('should allow custom filter', () => {
    const options = {
      filter: spy(() => false)
    };

    const plugin = minifyHTML(options);
    plugin.transform.apply((context as unknown) as TransformPluginContext, [
      'return',
      fileName
    ]);
    expect(options.filter.calledWith(fileName)).to.be.true;
  });
});
