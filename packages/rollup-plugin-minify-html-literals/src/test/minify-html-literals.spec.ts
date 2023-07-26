import {expect} from 'chai';
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

describe('minify-html-literals', () => {
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

  it('should minify "html" and "css" tagged templates', () => {
    const result = minifyHTMLLiterals(SOURCE, {fileName: 'test.js'});
    expect(result).to.be.an('object');
    expect(result!.code).to.equal(SOURCE_MIN);
  });

  it('should minify "svg" tagged templates', () => {
    const result = minifyHTMLLiterals(SVG_SOURCE, {fileName: 'test.js'});
    expect(result).to.be.an('object');
    expect(result!.code).to.equal(SVG_SOURCE_MIN);
  });

  it('should minify html with attribute placeholders that have no quotes and JS comments', () => {
    const result = minifyHTMLLiterals(COMMENT_SOURCE, {fileName: 'test.js'});
    expect(result).to.be.an('object');
    expect(result!.code).to.equal(COMMENT_SOURCE_MIN);
  });

  it('should minify html tagged with a member expression ending in html', () => {
    const result = minifyHTMLLiterals(MEMBER_EXPRESSION_LITERAL_SOURCE, {
      fileName: 'test.js',
    });
    expect(result).to.be.an('object');
    expect(result!.code).to.equal(MEMBER_EXPRESSION_LITERAL_SOURCE_MIN);
  });

  it('should minify multiline svg elements', () => {
    const result = minifyHTMLLiterals(SVG_MULTILINE_SOURCE, {
      fileName: 'test.js',
    });
    expect(result).to.be.an('object');
    expect(result!.code).to.equal(SVG_MULTILINE_SOURCE_MIN);
  });

  it('should not remove spaces in ::part()', () => {
    const result = minifyHTMLLiterals(SHADOW_PARTS_SOURCE, {
      fileName: 'test.js',
    });
    expect(result).to.be.an('object');
    expect(result!.code).to.equal(SHADOW_PARTS_SOURCE_MIN);
  });

  it('should return null if source is already minified', () => {
    const result = minifyHTMLLiterals(SOURCE_MIN, {fileName: 'test.js'});
    expect(result).to.be.null;
  });

  it('should return a v3 source map', () => {
    const result = minifyHTMLLiterals(SOURCE, {fileName: 'test.js'});
    expect(result).to.be.an('object');
    expect(result!.map).to.be.an('object');
    expect(result!.map!.version).to.equal(3);
    expect(result!.map!.mappings).to.be.a('string');
  });

  // TODO: fix this case
  it('fails to minify static html templates', () => {
    expect(() => minifyHTMLLiterals(STATIC_SOURCE, {fileName: 'test.js'})).to
      .throw;
  });

  describe('options', () => {
    let minifyHTMLSpy: Sinon.SinonSpy;

    beforeEach(() => {
      minifyHTMLSpy = Sinon.spy(defaultStrategy, 'minifyHTML');
    });

    afterEach(() => {
      minifyHTMLSpy.restore();
    });

    it('should use defaultMinifyOptions', () => {
      minifyHTMLLiterals(SOURCE, {fileName: 'test.js'});
      const parts = parseLiterals(SOURCE)[1].parts;
      const html = defaultStrategy.combineHTMLStrings(
        parts,
        defaultStrategy.getPlaceholder(parts)
      );
      expect(
        minifyHTMLSpy.lastCall.calledWithExactly(html, defaultMinifyOptions)
      ).to.be.true;
    });

    it('should allow custom partial minifyOptions', () => {
      const minifyOptions = {caseSensitive: false};
      minifyHTMLLiterals(SOURCE, {fileName: 'test.js', minifyOptions});
      const parts = parseLiterals(SOURCE)[1].parts;
      const html = defaultStrategy.combineHTMLStrings(
        parts,
        defaultStrategy.getPlaceholder(parts)
      );
      expect(
        minifyHTMLSpy.lastCall.calledWithExactly(html, {
          ...defaultMinifyOptions,
          ...minifyOptions,
        })
      ).to.be.true;
    });

    it('should use MagicString constructor', () => {
      let msUsed;
      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        generateSourceMap(ms) {
          msUsed = ms;
          return undefined;
        },
      });

      expect(msUsed).to.be.an.instanceof(MagicString);
    });

    it('should allow custom MagicStringLike constructor', () => {
      let msUsed;
      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        MagicString: MagicStringLike,
        generateSourceMap(ms) {
          msUsed = ms;
          return undefined;
        },
      });

      expect(msUsed).to.be.an.instanceof(MagicStringLike);
    });

    it('should allow custom parseLiterals()', () => {
      const customParseLiterals = Sinon.spy(
        (source: string, options?: ParseLiteralsOptions) => {
          return parseLiterals(source, options);
        }
      );

      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        parseLiterals: customParseLiterals,
      });
      expect(customParseLiterals.called).to.be.true;
    });

    it('should allow custom shouldMinify()', () => {
      const customShouldMinify = Sinon.spy((template: Template) => {
        return defaultShouldMinify(template);
      });

      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        shouldMinify: customShouldMinify,
      });
      expect(customShouldMinify.called).to.be.true;
    });

    it('should allow custom strategy', () => {
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
      expect(customStrategy.getPlaceholder.called).to.be.true;
      expect(customStrategy.combineHTMLStrings.called).to.be.true;
      expect(customStrategy.minifyHTML.called).to.be.true;
      expect(customStrategy.splitHTMLByPlaceholder.called).to.be.true;
    });

    it('should use defaultValidation', () => {
      expect(() => {
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
      }).to.throw;

      expect(() => {
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
      }).to.throw;
    });

    it('should allow disabling validation', () => {
      expect(() => {
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
      }).not.to.throw;
    });

    it('should allow custom validation', () => {
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
      expect(customValidation.ensurePlaceholderValid.called).to.be.true;
      expect(customValidation.ensureHTMLPartsValid.called).to.be.true;
    });

    it('should allow disabling generateSourceMap', () => {
      const result = minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        generateSourceMap: false,
      });
      expect(result).to.be.an('object');
      expect(result!.map).to.be.undefined;
    });

    it('should allow custom generateSourceMap()', () => {
      const customGenerateSourceMap = Sinon.spy(
        (ms: MagicStringLike, fileName: string) => {
          return defaultGenerateSourceMap(ms, fileName);
        }
      );

      minifyHTMLLiterals(SOURCE, {
        fileName: 'test.js',
        generateSourceMap: customGenerateSourceMap,
      });
      expect(customGenerateSourceMap.called).to.be.true;
    });
  });

  describe('defaultGenerateSourceMap()', () => {
    it('should call generateMap() on MagicStringLike with .map file, source name, and hires', () => {
      const ms = new MagicStringLike();
      const generateMapSpy = Sinon.spy(ms, 'generateMap');
      defaultGenerateSourceMap(ms, 'test.js');
      expect(
        generateMapSpy.calledWith({
          file: 'test.js.map',
          source: 'test.js',
          hires: true,
        })
      ).to.be.true;
    });
  });

  describe('defaultShouldMinify()', () => {
    it('should return true if the template is tagged with any "html" text', () => {
      expect(defaultShouldMinify({tag: 'html', parts: []})).to.be.true;
      expect(defaultShouldMinify({tag: 'HTML', parts: []})).to.be.true;
      expect(defaultShouldMinify({tag: 'hTML', parts: []})).to.be.true;
      expect(defaultShouldMinify({tag: 'getHTML()', parts: []})).to.be.true;
      expect(defaultShouldMinify({tag: 'templateHtml()', parts: []})).to.be
        .true;
    });

    it('should return false if the template is not tagged or does not contain "html"', () => {
      expect(defaultShouldMinify({parts: []})).to.be.false;
      expect(defaultShouldMinify({tag: 'css', parts: []})).to.be.false;
    });

    it('should return true if the template is tagged with any "svg" text', () => {
      expect(defaultShouldMinify({tag: 'svg', parts: []})).to.be.true;
      expect(defaultShouldMinify({tag: 'SVG', parts: []})).to.be.true;
      expect(defaultShouldMinify({tag: 'sVg', parts: []})).to.be.true;
      expect(defaultShouldMinify({tag: 'getSVG()', parts: []})).to.be.true;
      expect(defaultShouldMinify({tag: 'templateSvg()', parts: []})).to.be.true;
    });
  });

  describe('defaultShouldMinifyCSS()', () => {
    it('should return true if the template is tagged with any "css" text', () => {
      expect(defaultShouldMinifyCSS({tag: 'css', parts: []})).to.be.true;
      expect(defaultShouldMinifyCSS({tag: 'CSS', parts: []})).to.be.true;
      expect(defaultShouldMinifyCSS({tag: 'csS', parts: []})).to.be.true;
      expect(defaultShouldMinifyCSS({tag: 'getCSS()', parts: []})).to.be.true;
      expect(defaultShouldMinifyCSS({tag: 'templateCss()', parts: []})).to.be
        .true;
    });

    it('should return false if the template is not tagged or does not contain "css"', () => {
      expect(defaultShouldMinifyCSS({parts: []})).to.be.false;
      expect(defaultShouldMinifyCSS({tag: 'html', parts: []})).to.be.false;
    });
  });

  describe('defaultValidation', () => {
    describe('ensurePlaceholderValid()', () => {
      it('should throw an error if the placeholder is not a string', () => {
        expect(() => {
          defaultValidation.ensurePlaceholderValid(undefined);
        }).to.throw;
        expect(() => {
          defaultValidation.ensurePlaceholderValid(true);
        }).to.throw;
        expect(() => {
          defaultValidation.ensurePlaceholderValid({});
        }).to.throw;
      });

      it('should throw an error if the placeholder is an empty string', () => {
        expect(() => {
          defaultValidation.ensurePlaceholderValid('');
        }).to.throw;
      });

      it('should not throw an error if the placeholder is a non-empty string', () => {
        expect(() => {
          defaultValidation.ensurePlaceholderValid('EXP');
        }).not.to.throw;
      });
    });
  });
});
