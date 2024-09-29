import {test, describe as suite} from 'node:test';
import * as assert from 'node:assert/strict';
import {minify} from 'html-minifier';
import {defaultMinifyOptions, defaultStrategy} from '../lib/strategy.js';
import {TemplatePart} from '../lib/models.js';

suite('strategy', () => {
  suite('default', () => {
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

    suite('getPlaceholder()', () => {
      test('should return a string with @ and () in it with no spaces', () => {
        const placeholder = defaultStrategy.getPlaceholder(parts);
        assert.equal(placeholder.indexOf('@'), 0, 'should start with @');
        assert.ok(placeholder.includes('()'), 'should contain function parens');
      });

      test('should append "_" if placeholder exists in templates', () => {
        const regularPlaceholder = defaultStrategy.getPlaceholder(parts);
        const oneUnderscore = defaultStrategy.getPlaceholder([
          {
            text: regularPlaceholder,
            start: 0,
            end: regularPlaceholder.length,
          },
        ]);

        assert.notEqual(oneUnderscore, regularPlaceholder);
        assert.ok(oneUnderscore.includes('_'));

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

        assert.notEqual(twoUnderscores, regularPlaceholder);
        assert.notEqual(twoUnderscores, oneUnderscore);
        assert.ok(twoUnderscores.includes('__'));
      });

      test('should return a value that is preserved by html-minifier when splitting', () => {
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
        assert.equal(
          defaultStrategy.splitHTMLByPlaceholder(minHtml, placeholder).length,
          9
        );
      });
    });

    suite('combineHTMLStrings()', () => {
      test('should join part texts by the placeholder', () => {
        const expected = '<h1>EXP</h1>';
        assert.equal(
          defaultStrategy.combineHTMLStrings(parts, 'EXP'),
          expected
        );
      });
    });

    suite('minifyHTML()', () => {
      test('should call minify() with html and options', () => {
        const placeholder = defaultStrategy.getPlaceholder(parts);
        const html = `
          <style>${placeholder}</style>
          <h1 class="heading">${placeholder}</h1>
          <ul>
            <li>${placeholder}</li>
          </ul>
        `;

        assert.equal(
          defaultStrategy.minifyHTML(html, defaultMinifyOptions),
          minify(html, defaultMinifyOptions)
        );
      });
    });

    suite('splitHTMLByPlaceholder()', () => {
      test('should split string by the placeholder', () => {
        const expected = ['<h1>', '</h1>'];
        assert.deepEqual(
          defaultStrategy.splitHTMLByPlaceholder('<h1>EXP</h1>', 'EXP'),
          expected
        );
      });

      test('should handle if a placeholder is missing its semicolon', () => {
        const expected = ['<h1>', '</h1><button onclick="', '"></button>'];
        const html = `<h1>EXP;</h1><button onclick="EXP"></button>`;
        assert.deepEqual(
          defaultStrategy.splitHTMLByPlaceholder(html, 'EXP;'),
          expected
        );
      });
    });
  });
});
