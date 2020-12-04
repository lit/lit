/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {extractMessagesFromProgram} from '../program-analysis.js';
import {ProgramMessage} from '../messages.js';
import * as ts from 'typescript';
import test, {ExecutionContext} from 'ava';
import {
  createTsProgramFromFragment,
  CompilerHostCache,
} from './compile-ts-fragment';

const cache = new CompilerHostCache();

/**
 * Analyze the given fragment of TypeScript source code with the lit-localize
 * message extractors. Check that the expected extracted messages and/or
 * diagnostics are returned.
 */
function checkAnalysis(
  t: ExecutionContext,
  inputTs: string,
  expectedMessages: Array<
    Pick<ProgramMessage, 'name' | 'contents' | 'params'> &
      Partial<Pick<ProgramMessage, 'descStack'>>
  >,
  expectedErrors: string[] = []
) {
  const options = ts.getDefaultCompilerOptions();
  options.target = ts.ScriptTarget.ES2015;
  options.module = ts.ModuleKind.ESNext;
  options.moduleResolution = ts.ModuleResolutionKind.NodeJs;
  // Don't automatically load typings from nodes_modules/@types, we're not using
  // them here, so it's a waste of time.
  options.typeRoots = [];
  const {program, host} = createTsProgramFromFragment(
    inputTs,
    options,
    cache,
    () => undefined
  );
  const {messages, errors} = extractMessagesFromProgram(program);
  t.deepEqual(
    errors.map((diagnostic) => ts.formatDiagnostic(diagnostic, host).trim()),
    expectedErrors
  );
  t.deepEqual(
    messages.map(({name, contents, params, descStack}) => ({
      name,
      contents,
      params,
      descStack,
    })),
    expectedMessages.map(({name, contents, params, descStack}) => ({
      name,
      contents,
      params,
      descStack: descStack ?? [],
    }))
  );
}

test('irrelevant code', (t) => {
  const src = 'const foo = "foo";';
  checkAnalysis(t, src, []);
});

test('string message', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    msg('Hello World', {id: 'greeting'});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: ['Hello World'],
    },
  ]);
});

test('HTML message', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    msg(html\`<b>Hello World</b>\`, {id: 'greeting'});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: [
        {untranslatable: '<b>'},
        'Hello World',
        {untranslatable: '</b>'},
      ],
    },
  ]);
});

test('HTML message with comment', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    msg(html\`<b><!-- greeting -->Hello World</b>\`, {id: 'greeting'});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: [
        {untranslatable: '<b><!-- greeting -->'},
        'Hello World',
        {untranslatable: '</b>'},
      ],
    },
  ]);
});

test('parameterized string message', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    msg((name: string) => \`Hello \${name}\`, {id: 'greeting', args: ["friend"]});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: ['Hello ', {untranslatable: '${name}'}],
      params: ['name'],
    },
  ]);
});

test('parameterized HTML message', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    msg((name: string) => html\`<b>Hello \${name}</b>\`, {id: 'greeting', args: ["friend"]);
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: [
        {untranslatable: '<b>'},
        'Hello ',
        {untranslatable: '${name}</b>'},
      ],
      params: ['name'],
    },
  ]);
});

test('immediate description', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    // msgdesc: Greeting
    msg('Hello World', {id: 'greeting'});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: ['Hello World'],
      descStack: ['Greeting'],
    },
  ]);
});

test('inherited description', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    // msgdesc: Greeter
    class XGreeter extends HTMLElement {
      render() {
        // msgdesc: Greeting
        return msg('Hello World', {id: 'greeting'});
      }
    }
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: ['Hello World'],
      descStack: ['Greeter', 'Greeting'],
    },
  ]);
});

test('different msg function', (t) => {
  const src = `
    function msg(id: string, template: string) {
      return template;
    }
    msg('Greeting', {id: 'greeting'});
  `;
  checkAnalysis(t, src, []);
});

test('error: message id cannot be empty', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    msg('Hello World', {id: ''});
  `;
  checkAnalysis(
    t,
    src,
    [],
    [
      '__DUMMY__.ts(3,29): error TS2324: Options id property must be a non-empty string literal',
    ]
  );
});

test('error: options must be object literal', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    const options = {id: 'greeting'};
    msg('Hello World', options);
  `;
  checkAnalysis(
    t,
    src,
    [],
    [
      '__DUMMY__.ts(4,24): error TS2324: Expected second argument to msg() to be an object literal',
    ]
  );
});

test('error: options must be long-form', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    const id = 'greeting';
    msg('Hello World', {id});
  `;
  checkAnalysis(
    t,
    src,
    [],
    [
      '__DUMMY__.ts(4,25): error TS2324: Options object must use identifier or string literal property assignments. Shorthand and spread assignments are not supported.',
    ]
  );
});

test('error: message id must be static', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    const id = 'greeting';
    msg('Hello World', {id: id});
    msg('Hello World', {id: \`\${id}\`});
  `;
  checkAnalysis(
    t,
    src,
    [],
    [
      '__DUMMY__.ts(4,29): error TS2324: Options id property must be a non-empty string literal',
      '__DUMMY__.ts(5,29): error TS2324: Options id property must be a non-empty string literal',
    ]
  );
});

test('error: placeholders must use function', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    const foo = 'foo';
    msg(\`Hello \${name}\`, {id: 'greeting'});
    msg(html\`<b>Hello \${name}</b>\`, {id: 'greeting'});
  `;
  checkAnalysis(
    t,
    src,
    [],
    [
      '__DUMMY__.ts(4,9): error TS2324: To use a variable, pass an arrow function.',
      '__DUMMY__.ts(5,9): error TS2324: To use a variable, pass an arrow function.',
    ]
  );
});

test('error: placeholders must only reference function parameters', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    const foo = 'foo';
    msg((name) => \`Hello \${name} \${foo}\`, {id: 'greeting', args: ['Friend']);
  `;
  checkAnalysis(
    t,
    src,
    [],
    [
      '__DUMMY__.ts(4,36): error TS2324: Placeholder must be one of the following identifiers: name',
    ]
  );
});

test('error: different message contents', (t) => {
  const src = `
    import {msg} from './lit-localize.js';
    msg('Hello World', {id: 'greeting'});
    msg('Hello Friend', {id: 'greeting'});
  `;
  checkAnalysis(
    t,
    src,
    [
      {
        name: 'greeting',
        contents: ['Hello World'],
      },
    ],
    [
      '__DUMMY__.ts(4,5): error TS2324: Message ids must have the same default text wherever they are used',
    ]
  );
});
