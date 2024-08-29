import * as assert from 'node:assert/strict';
import {test, describe as suite, afterEach, beforeEach} from 'node:test';
import MagicString, {SourceMapOptions} from 'magic-string';
import {Options as HTMLOptions} from 'html-minifier';
import {ParseLiteralsOptions, parseLiterals} from '../lib/parse-literals.js';
import {Template, TemplatePart} from '../lib/models.js';
import Sinon from 'sinon';

import {
  SourceMap,
  defaultGenerateSourceMap,
  defaultShouldMinify,
  defaultShouldMinifyCSS,
  defaultValidation,
  minifyHTMLLiterals,
} from '../lib/minify-html-literals.js';
import {defaultMinifyOptions, defaultStrategy} from '../lib/strategy.js';

class MagicStringLike {
  generateMap(options?: Partial<SourceMapOptions>): SourceMap {
    return {
      version: 3,
      file: (options && options.file) || null,
      sources: [(options && options.source) || null],
      sourcesContent: [],
      names: [],
      mappings: '',
      toString() {
        return '';
      },
      toUrl() {
        return '';
      },
    };
  }

  overwrite(_start: number, _end: number, _content: string): void {
    // noop
  }

  toString(): string {
    return '';
  }
}

suite('minify-html-literals', () => {
  const SOURCE = `
    function render(title, items, styles) {
      return html\`
        <style>
          \${styles}
        </style>
        <h1 class="heading">\${title}</h1>
        <button onclick="\${() => eventHandler()}"></button>
        <ul>
          \${items.map(item => {
            return getHTML()\`
              <li>\${item}</li>
            \`;
          })}
        </ul>
      \`;
    }

    function noMinify() {
      return \`
        <div>Not tagged html</div>
      \`;
    }

    function taggednoMinify(extra) {
      return other\`
        <style>
          .heading {
            font-size: 24px;
          }

          \${extra}
        </style>
      \`;
    }

    function taggedCSSMinify(extra) {
      return css\`
        .heading {
          font-size: 24px;
        }

        \${extra}
      \`;
    }

    function cssProperty(property) {
      const width = '20px';
      return css\`
        .foo {
          font-size: 1rem;
          width: \${width};
          color: \${property};
        }
      \`;
    }
  `;

  const SOURCE_MIN = `
    function render(title, items, styles) {
      return html\`<style>\${styles}</style><h1 class="heading">\${title}</h1><button onclick="\${() => eventHandler()}"></button><ul>\${items.map(item => {
            return getHTML()\`<li>\${item}</li>\`;
          })}</ul>\`;
    }

    function noMinify() {
      return \`
        <div>Not tagged html</div>
      \`;
    }

    function taggednoMinify(extra) {
      return other\`
        <style>
          .heading {
            font-size: 24px;
          }

          \${extra}
        </style>
      \`;
    }

    function taggedCSSMinify(extra) {
      return css\`.heading{font-size:24px}\${extra}\`;
    }

    function cssProperty(property) {
      const width = '20px';
      return css\`.foo{font-size:1rem;width:\${width};color:\${property}}\`;
    }
  `;

  const STATIC_SOURCE = `
    function render() {
      const tagName = literal\`span\`
      return html\`
        <\${tagName}>
        span content
        </\${tagName}>
      \`;
    }
  `;

  const SVG_SOURCE = `
    function taggedSVGMinify() {
      return svg\`
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
          <path d="M6 19h12v2H6z" />
          <path d="M0 0h24v24H0V0z" fill="none" />
        </svg>
      \`;
    }
  `;

  const SVG_SOURCE_MIN = `
    function taggedSVGMinify() {
      return svg\`<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M6 19h12v2H6z"/><path d="M0 0h24v24H0V0z" fill="none"/></svg>\`;
    }
  `;

  const COMMENT_SOURCE = `
    function minifyWithComment() {
      return html\`
        <div .icon=\${0/*JS Comment */}>
        </div>
      \`;
    }
  `;

  const COMMENT_SOURCE_MIN = `
    function minifyWithComment() {
      return html\`<div .icon="\${0/*JS Comment */}"></div>\`;
    }
  `;

  const SVG_MULTILINE_SOURCE = `
    function multiline() {
      return html\`
        <pre>
          Keep newlines

          within certain tags
        </pre>
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
          <path d="M6 19h12v2H6z" />
          <path d="M0
                   0h24v24H0V0z"
                fill="none" />
        </svg>
      \`;
    }
  `;

  const SVG_MULTILINE_SOURCE_MIN = `
    function multiline() {
      return html\`<pre>
          Keep newlines

          within certain tags
        </pre><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M6 19h12v2H6z"/><path d="M0                   0h24v24H0V0z" fill="none"/></svg>\`;
    }
  `;

  const SHADOW_PARTS_SOURCE = `
    function parts() {
      return css\`
        foo-bar::part(space separated) {
          color: red;
        }
      \`;
    }
  `;

  const SHADOW_PARTS_SOURCE_MIN = `
    function parts() {
      return css\`foo-bar::part(space separated){color:red}\`;
    }
  `;

  const MEMBER_EXPRESSION_LITERAL_SOURCE = `
    function nested() {
      return LitHtml.html\`<div id="container">
        <span>Some content here</span>
      </div>
      \`;
    }
  `;

  const MEMBER_EXPRESSION_LITERAL_SOURCE_MIN = `
    function nested() {
      return LitHtml.html\`<div id="container"><span>Some content here</span></div>\`;
    }
  `;

  test('should minify "html" and "css" tagged templates', () => {
    const result = minifyHTMLLiterals(SOURCE, {fileName: 'test.js'});
    assert.equal(typeof result, 'object');
    assert.equal(result!.code, SOURCE_MIN);
  });

  test('should minify "svg" tagged templates', () => {
    const result = minifyHTMLLiterals(SVG_SOURCE, {fileName: 'test.js'});
    assert.equal(typeof result, 'object');
    assert.equal(result!.code, SVG_SOURCE_MIN);
  });

  test('should minify html with attribute placeholders that have no quotes and JS comments', () => {
    const result = minifyHTMLLiterals(COMMENT_SOURCE, {fileName: 'test.js'});
    assert.equal(typeof result, 'object');
    assert.equal(result!.code, COMMENT_SOURCE_MIN);
  });

  test('should minify html tagged with a member expression ending in html', () => {
    const result = minifyHTMLLiterals(MEMBER_EXPRESSION_LITERAL_SOURCE, {
      fileName: 'test.js',
    });
    assert.equal(typeof result, 'object');
    assert.equal(result!.code, MEMBER_EXPRESSION_LITERAL_SOURCE_MIN);
  });

  test('should minify multiline svg elements', () => {
    const result = minifyHTMLLiterals(SVG_MULTILINE_SOURCE, {
      fileName: 'test.js',
    });
    assert.equal(typeof result, 'object');
    assert.equal(result!.code, SVG_MULTILINE_SOURCE_MIN);
  });

  test('should not remove spaces in ::part()', () => {
    const result = minifyHTMLLiterals(SHADOW_PARTS_SOURCE, {
      fileName: 'test.js',
    });
    assert.equal(typeof result, 'object');
    assert.equal(result!.code, SHADOW_PARTS_SOURCE_MIN);
  });

  test('should return null if source is already minified', () => {
    const result = minifyHTMLLiterals(SOURCE_MIN, {fileName: 'test.js'});
    assert.equal(result, null);
  });

  test('should return a v3 source map', () => {
    const result = minifyHTMLLiterals(SOURCE, {fileName: 'test.js'});
    assert.equal(typeof result, 'object');
    assert.equal(typeof result!.map, 'object');
    assert.equal(result!.map!.version, 3);
    assert.equal(typeof result!.map!.mappings, 'string');
  });

  // TODO: fix this case
  test('fails to minify static html templates', () => {
    assert.throws(() =>
      minifyHTMLLiterals(STATIC_SOURCE, {fileName: 'test.js'})
    );
  });

  suite('options', () => {
    let minifyHTMLSpy: Sinon.SinonSpy;

    beforeEach(() => {
      minifyHTMLSpy = Sinon.spy(defaultStrategy, 'minifyHTML');
    });

    afterEach(() => {
      minifyHTMLSpy.restore();
    });

    test('should use defaultMinifyOptions', () => {
      minifyHTMLLiterals(SOURCE, {fileName: 'test.js'});
      const parts = parseLiterals(SOURCE)[1].parts;
      const html = defaultStrategy.combineHTMLStrings(
        parts,
        defaultStrategy.getPlaceholder(parts)
      );
      assert.ok(
        minifyHTMLSpy.lastCall.calledWithExactly(html, defaultMinifyOptions)
      );
    });

    test('should allow custom partial minifyOptions', () => {
      const minifyOptions = {caseSensitive: false};
      minifyHTMLLiterals(SOURCE, {fileName: 'test.js', minifyOptions});
      const parts = parseLiterals(SOURCE)[1].parts;
      const html = defaultStrategy.combineHTMLStrings(
        parts,
        defaultStrategy.getPlaceholder(parts)
      );
      assert.ok(
        minifyHTMLSpy.lastCall.calledWithExactly(html, {
          ...defaultMinifyOptions,
          ...minifyOptions,
        })
      );
    });

    test('should use MagicString constructor', () => {
      let msUsed: unknown;
      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        generateSourceMap(ms) {
          msUsed = ms;
          return undefined;
        },
      });

      assert.ok(msUsed instanceof MagicString);
    });

    test('should allow custom MagicStringLike constructor', () => {
      let msUsed: unknown;
      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        MagicString: MagicStringLike,
        generateSourceMap(ms) {
          msUsed = ms;
          return undefined;
        },
      });

      assert.ok(msUsed instanceof MagicStringLike);
    });

    test('should allow custom parseLiterals()', () => {
      const customParseLiterals = Sinon.spy(
        (source: string, options?: ParseLiteralsOptions) => {
          return parseLiterals(source, options);
        }
      );

      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        parseLiterals: customParseLiterals,
      });
      assert.ok(customParseLiterals.called);
    });

    test('should allow custom shouldMinify()', () => {
      const customShouldMinify = Sinon.spy((template: Template) => {
        return defaultShouldMinify(template);
      });

      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        shouldMinify: customShouldMinify,
      });
      assert.ok(customShouldMinify.called);
    });

    test('should allow custom strategy', () => {
      const customStrategy = {
        getPlaceholder: Sinon.spy((parts: TemplatePart[]) => {
          return defaultStrategy.getPlaceholder(parts);
        }),
        combineHTMLStrings: Sinon.spy(
          (parts: TemplatePart[], placeholder: string) => {
            return defaultStrategy.combineHTMLStrings(parts, placeholder);
          }
        ),
        minifyHTML: Sinon.spy((html: string, options?: HTMLOptions) => {
          return defaultStrategy.minifyHTML(html, options);
        }),
        splitHTMLByPlaceholder: Sinon.spy(
          (html: string, placeholder: string) => {
            return defaultStrategy.splitHTMLByPlaceholder(html, placeholder);
          }
        ),
      };

      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        strategy: customStrategy,
      });
      assert.ok(customStrategy.getPlaceholder.called);
      assert.ok(customStrategy.combineHTMLStrings.called);
      assert.ok(customStrategy.minifyHTML.called);
      assert.ok(customStrategy.splitHTMLByPlaceholder.called);
    });

    test('should use defaultValidation', () => {
      assert.throws(() => {
        minifyHTMLLiterals(SOURCE, {
          fileName: 'test.js',
          strategy: {
            getPlaceholder: () => {
              return ''; // cause an error
            },
            combineHTMLStrings: defaultStrategy.combineHTMLStrings,
            minifyHTML: defaultStrategy.minifyHTML,
            splitHTMLByPlaceholder: defaultStrategy.splitHTMLByPlaceholder,
          },
        });
      });

      assert.throws(() => {
        minifyHTMLLiterals(SOURCE, {
          fileName: 'test.js',
          strategy: {
            getPlaceholder: defaultStrategy.getPlaceholder,
            combineHTMLStrings: defaultStrategy.combineHTMLStrings,
            minifyHTML: defaultStrategy.minifyHTML,
            splitHTMLByPlaceholder: () => {
              return []; // cause an error
            },
          },
        });
      });
    });

    test('should allow disabling validation', () => {
      assert.doesNotThrow(() => {
        minifyHTMLLiterals(SOURCE, {
          fileName: 'test.js',
          strategy: {
            getPlaceholder: () => {
              return ''; // cause an error
            },
            combineHTMLStrings: defaultStrategy.combineHTMLStrings,
            minifyHTML: defaultStrategy.minifyHTML,
            splitHTMLByPlaceholder: defaultStrategy.splitHTMLByPlaceholder,
          },
          validate: false,
        });
      });
    });

    test('should allow custom validation', () => {
      const customValidation = {
        ensurePlaceholderValid: Sinon.spy((placeholder: unknown) => {
          return defaultValidation.ensurePlaceholderValid(placeholder);
        }),
        ensureHTMLPartsValid: Sinon.spy(
          (parts: TemplatePart[], htmlParts: string[]) => {
            return defaultValidation.ensureHTMLPartsValid(parts, htmlParts);
          }
        ),
      };

      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        validate: customValidation,
      });
      assert.ok(customValidation.ensurePlaceholderValid.called);
      assert.ok(customValidation.ensureHTMLPartsValid.called);
    });

    test('should allow disabling generateSourceMap', () => {
      const result = minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        generateSourceMap: false,
      });
      assert.equal(typeof result, 'object');
      assert.equal(result!.map, undefined);
    });

    test('should allow custom generateSourceMap()', () => {
      const customGenerateSourceMap = Sinon.spy(
        (ms: MagicStringLike, fileName: string) => {
          return defaultGenerateSourceMap(ms, fileName);
        }
      );

      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        generateSourceMap: customGenerateSourceMap,
      });
      assert.ok(customGenerateSourceMap.called);
    });
  });

  suite('defaultGenerateSourceMap()', () => {
    test('should call generateMap() on MagicStringLike with .map file, source name, and hires', () => {
      const ms = new MagicStringLike();
      const generateMapSpy = Sinon.spy(ms, 'generateMap');
      defaultGenerateSourceMap(ms, 'test.js');
      assert.ok(
        generateMapSpy.calledWith({
          file: 'test.js.map',
          source: 'test.js',
          hires: true,
        })
      );
    });
  });

  suite('defaultShouldMinify()', () => {
    test('should return true if the template is tagged with any "html" text', () => {
      assert.ok(defaultShouldMinify({tag: 'html', parts: []}));
      assert.ok(defaultShouldMinify({tag: 'HTML', parts: []}));
      assert.ok(defaultShouldMinify({tag: 'hTML', parts: []}));
      assert.ok(defaultShouldMinify({tag: 'getHTML()', parts: []}));
      assert.ok(defaultShouldMinify({tag: 'templateHtml()', parts: []}));
    });

    test('should return false if the template is not tagged or does not contain "html"', () => {
      assert.equal(defaultShouldMinify({parts: []}), false);
      assert.equal(defaultShouldMinify({tag: 'css', parts: []}), false);
    });

    test('should return true if the template is tagged with any "svg" text', () => {
      assert.ok(defaultShouldMinify({tag: 'svg', parts: []}));
      assert.ok(defaultShouldMinify({tag: 'SVG', parts: []}));
      assert.ok(defaultShouldMinify({tag: 'sVg', parts: []}));
      assert.ok(defaultShouldMinify({tag: 'getSVG()', parts: []}));
      assert.ok(defaultShouldMinify({tag: 'templateSvg()', parts: []}));
    });
  });

  suite('defaultShouldMinifyCSS()', () => {
    test('should return true if the template is tagged with any "css" text', () => {
      assert.ok(defaultShouldMinifyCSS({tag: 'css', parts: []}));
      assert.ok(defaultShouldMinifyCSS({tag: 'CSS', parts: []}));
      assert.ok(defaultShouldMinifyCSS({tag: 'csS', parts: []}));
      assert.ok(defaultShouldMinifyCSS({tag: 'getCSS()', parts: []}));
      assert.ok(defaultShouldMinifyCSS({tag: 'templateCss()', parts: []}));
    });

    test('should return false if the template is not tagged or does not contain "css"', () => {
      assert.equal(defaultShouldMinifyCSS({parts: []}), false);
      assert.equal(defaultShouldMinifyCSS({tag: 'html', parts: []}), false);
    });
  });

  suite('defaultValidation', () => {
    suite('ensurePlaceholderValid()', () => {
      test('should throw an error if the placeholder is not a string', () => {
        assert.throws(() => {
          defaultValidation.ensurePlaceholderValid(undefined);
        });
        assert.throws(() => {
          defaultValidation.ensurePlaceholderValid(true);
        });
        assert.throws(() => {
          defaultValidation.ensurePlaceholderValid({});
        });
      });

      test('should throw an error if the placeholder is an empty string', () => {
        assert.throws(() => {
          defaultValidation.ensurePlaceholderValid('');
        });
      });

      test('should not throw an error if the placeholder is a non-empty string', () => {
        assert.doesNotThrow(() => {
          defaultValidation.ensurePlaceholderValid('EXP');
        });
      });
    });
  });
});
