/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {fnv1a64} from '../internal/fnv1a64.js';

suite('fnv1a64 (UTF-16 encoded)', () => {
  suite('simple strings', () => {
    const cases: Array<[string, string]> = [
      ['!', 'af639c4c86017fcc'],
      [' ', 'af639d4c8601817f'],
      ['\t', 'af63c44c8601c3c4'],
      ['\n', 'af63c74c8601c8dd'],
      ['\r\n', '083cb407b4f40f36'],
      ['  ', '07c5a807b48ed46d'],
      ['0', 'af63ad4c86019caf'],
      ['1', 'af63ac4c86019afc'],
      ['9', 'af63b44c8601a894'],
      ['A', 'af63fc4c860222ec'],
      ['a', 'af63dc4c8601ec8c'],
      ['b', 'af63df4c8601f1a5'],
      ['z', 'af63f74c86021a6d'],
      ['foo', 'dcb27518fed9d577'],
      ['foobar', '85944171f73967e8'],
      ['Hello', '63f0bfacf2c00f6b'],
      ['hello', 'a430d84680aabd0b'],
      ['HELLO', 'a0b400b98ea8182b'],
      ['Hello, World!', '6ef05bd7cc857c54'],
      ['123456789', '06d5573923c6cdfc'],
      ['aaaaaaaaaa', '4a11f19e8a35a0df'],
      ['The quick brown fox jumps over the lazy dog', 'f3f9b7f5e7e47110'],
    ];

    for (const [input, expected] of cases) {
      test(`fnv1a64(${JSON.stringify(input)}) === '${expected}'`, () => {
        assert.strictEqual(fnv1a64(input), expected);
      });
    }
  });

  suite('strings with multi-byte characters', () => {
    const cases: Array<[string, string]> = [
      ['à', 'af645d4c8602c7bf'],
      ['é', 'af64644c8602d3a4'],
      ['ü', 'af64714c8602e9bb'],
      ['ÿ', 'af64724c8602eb6e'],
      ['Ā', 'af62bd4c860004df'],
      ['Α', 'af614c4c85fd91dc'],
      ['café', 'b538f990e85962dc'],
      ['中', 'afada04c867f4498'],
      ['文', 'af873a4c863e0546'],
      ['中文hello', '893d3c50eb4e6a63'],
      ['こんにちは', '928563db134ea99c'],
      ['😀', 'e5e45a0a241b88d8'],
      ['😂', 'e5e45c0a241b8c3e'],
      ['🎉', 'e5e3370a2416b736'],
      ['💩', 'e5e1f30a241773d3'],
      ['Hello 😀!', '4f9c4e53caab2817'],
      ['😀😁😂', '26ecb24636aff945'],
    ];

    for (const [input, expected] of cases) {
      test(`fnv1a64(${JSON.stringify(input)}) === '${expected}'`, () => {
        assert.strictEqual(fnv1a64(input), expected);
      });
    }
  });

  suite('localize template patterns', () => {
    const cases: Array<[string, string[], string]> = [
      ['`Hello World!` (no expr)', ['Hello World!'], '8c0ec8d1fb9e6e32'],
      ['`foo${x}bar`', ['foo', 'bar'], '53466860e5a8e1c4'],
      ['`${x}bar`', ['', 'bar'], '078a21367224460e'],
      ['`foo${x}`', ['foo', ''], 'dd1262790c25a16b'],
      ['`${a} and ${b}`', ['', ' and ', ''], 'acbb1ccb24f8f136'],
      ['`${a}${b}`', ['', '', ''], '087d6a07b52b286d'],
      ['`a${x}b${y}c${z}d`', ['a', 'b', 'c', 'd'], 'a832aec5984e34f5'],
      ['str`Hello ${name}!`', ['Hello ', '!'], '00ad08ebae1e0f74'],
      [
        'html`Hello <b>World</b>!` (no expr)',
        ['Hello <b>World</b>!'],
        '3c44aff2d5f5ef6b',
      ],
      [
        'html`Hello <b>${name}</b>!`',
        ['Hello <b>', '</b>!'],
        '82ccc38d4d46eaa9',
      ],
      ['html`<p>${x}</p>`', ['<p>', '</p>'], '33af4d7b1944575a'],
      [
        'html`<div class="c">${x}</div>`',
        ['<div class="c">', '</div>'],
        '79f9b202f3d2d3da',
      ],
      [
        'html`<b>${a}</b> and <i>${b}</i>`',
        ['<b>', '</b> and <i>', '</i>'],
        '251c98125b984138',
      ],
      [
        'html`<ul>${a}<li>${b}</li>${c}</ul>`',
        ['<ul>', '<li>', '</li>', '</ul>'],
        'd69770b5107dc9bb',
      ],
    ];

    for (const [desc, parts, expected] of cases) {
      test(desc, () => {
        assert.strictEqual(fnv1a64(parts.join('\x1e')), expected);
      });
    }
  });

  suite('edge cases', () => {
    const cases: Array<[string, string]> = [
      ['', 'cbf29ce484222325'], // empty string
      ['\x00', 'af63bd4c8601b7df'], // null
      ['\x00\x00', '08328807b4eb6fed'], // two nulls
      ['\x1e', 'af63d34c8601dd41'], // record separator (HASH_DELIMITER)
      ['\u0080', 'af643d4c8602915f'], // first Latin-1 supplement
      ['\u7fff', 'af9d724c8663c66e'], // max signed 16-bit
      ['\u8000', 'afe3bd4c86db37df'], // min unsigned high half
      ['\ud7ff', 'b035724c87660e6e'], // last char before surrogate range
      ['\ue000', 'b003bd4c871197df'], // first private use area
      ['\uffff', 'b01d724c873d466e'], // max BMP codepoint
      ['\uD800', 'b03bbd4c8770bfdf'], // lone high surrogate
      ['\uDFFF', 'b03d724c8773a66e'], // lone low surrogate
      ['\uD800\uD800', 'e5ea880a24007fed'], // two high surrogates
      ['\uffff\uffff\uffff\uffff', '1d897ee756acb351'], // four max BMP
      ['a'.repeat(64), 'db007849f35ebbe5'], // 64 repeated chars
      ['\uFFFF'.repeat(128), '545a7372a27d9ca5'], // 128 max BMP codepoints
    ];

    for (const [input, expected] of cases) {
      test(`fnv1a64(${JSON.stringify(input)}) === '${expected}'`, () => {
        assert.strictEqual(fnv1a64(input), expected);
      });
    }
  });
});
