import {expect} from 'chai';
import {minify} from 'html-minifier';
import {defaultMinifyOptions, defaultStrategy} from '../lib/strategy.js';
import {TemplatePart} from '../lib/models.js';

describe('strategy', () => {
  describe('default', () => {
    const parts: TemplatePart[] = [
      {
        text: '<h1>',
        start: 0,
        end: 4,
      },
      {
        text: '</h1>',
        start: 4,
        end: 5,
      },
    ];

    describe('getPlaceholder()', () => {
      it('should return a string with @ and () in it with no spaces', () => {
        const placeholder = defaultStrategy.getPlaceholder(parts);
        expect(placeholder.indexOf('@')).to.equal(0, 'should start with @');
        expect(placeholder).to.include('()', 'should contain function parens');
      });

      it('should append "_" if placeholder exists in templates', () => {
        const regularPlaceholder = defaultStrategy.getPlaceholder(parts);
        const oneUnderscore = defaultStrategy.getPlaceholder([
          {
            text: regularPlaceholder,
            start: 0,
            end: regularPlaceholder.length,
          },
        ]);

        expect(oneUnderscore).not.to.equal(regularPlaceholder);
        expect(oneUnderscore).to.include('_');

        const twoUnderscores = defaultStrategy.getPlaceholder([
          {
            text: regularPlaceholder,
            start: 0,
            end: regularPlaceholder.length,
          },
          {
            text: oneUnderscore,
            start: regularPlaceholder.length,
            end: regularPlaceholder.length + oneUnderscore.length,
          },
        ]);

        expect(twoUnderscores).not.to.equal(regularPlaceholder);
        expect(twoUnderscores).not.to.equal(oneUnderscore);
        expect(twoUnderscores).to.include('__');
      });

      it('should return a value that is preserved by html-minifier when splitting', () => {
        const placeholder = defaultStrategy.getPlaceholder(parts);
        const minHtml = defaultStrategy.minifyHTML(
          `
          <style>
            ${placeholder}

            p {
              ${placeholder}
              color: ${placeholder}
            }

            div {
              width: ${placeholder}
            }
          </style>
          <p style="color: ${placeholder}">
            ${placeholder}
          </p>
          <div id="${placeholder}" class="with ${placeholder}"></div>
        `,
          defaultMinifyOptions
        );

        // 8 placeholders, 9 parts
        expect(
          defaultStrategy.splitHTMLByPlaceholder(minHtml, placeholder)
        ).to.have.lengthOf(9);
      });
    });

    describe('combineHTMLStrings()', () => {
      it('should join part texts by the placeholder', () => {
        const expected = '<h1>EXP</h1>';
        expect(defaultStrategy.combineHTMLStrings(parts, 'EXP')).to.equal(
          expected
        );
      });
    });

    describe('minifyHTML()', () => {
      it('should call minify() with html and options', () => {
        const placeholder = defaultStrategy.getPlaceholder(parts);
        const html = `
          <style>${placeholder}</style>
          <h1 class="heading">${placeholder}</h1>
          <ul>
            <li>${placeholder}</li>
          </ul>
        `;

        expect(defaultStrategy.minifyHTML(html, defaultMinifyOptions)).to.equal(
          minify(html, defaultMinifyOptions)
        );
      });
    });

    describe('splitHTMLByPlaceholder()', () => {
      it('should split string by the placeholder', () => {
        const expected = ['<h1>', '</h1>'];
        expect(
          defaultStrategy.splitHTMLByPlaceholder('<h1>EXP</h1>', 'EXP')
        ).to.deep.equal(expected);
      });

      it('should handle if a placeholder is missing its semicolon', () => {
        const expected = ['<h1>', '</h1><button onclick="', '"></button>'];
        const html = `<h1>EXP;</h1><button onclick="EXP"></button>`;
        expect(
          defaultStrategy.splitHTMLByPlaceholder(html, 'EXP;')
        ).to.deep.equal(expected);
      });
    });
  });
});
