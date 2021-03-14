/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import test, {Test} from 'tape';

import {extractMessagesFromProgram} from '../program-analysis.js';
import {ProgramMessage} from '../messages.js';
import ts from 'typescript';
import {
  createTsProgramFromFragment,
  CompilerHostCache,
} from './compile-ts-fragment.js';

const cache = new CompilerHostCache();

/**
 * Analyze the given fragment of TypeScript source code with the lit-localize
 * message extractors. Check that the expected extracted messages and/or
 * diagnostics are returned.
 */
function checkAnalysis(
  t: Test,
  inputTs: string,
  expectedMessages: Array<
    Pick<ProgramMessage, 'name' | 'contents'> &
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
    messages.map(({name, contents, descStack}) => ({
      name,
      contents,
      descStack,
    })),
    expectedMessages.map(({name, contents, descStack}) => ({
      name,
      contents,
      descStack: descStack ?? [],
    }))
  );
}

test('irrelevant code', (t) => {
  const src = 'const foo = "foo";';
  checkAnalysis(t, src, []);
  t.end();
});

test('string message', (t) => {
  const src = `
    import {msg} from '@lit/localize';
    msg('Hello World', {id: 'greeting'});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: ['Hello World'],
    },
  ]);
  t.end();
});

test('string message unnecessarily tagged with str', (t) => {
  const src = `
    import {msg, str} from '@lit/localize';
    msg(str\`Hello World\`, {id: 'greeting'});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: ['Hello World'],
    },
  ]);
  t.end();
});

test('string message (auto ID)', (t) => {
  const src = `
    import {msg} from '@lit/localize';
    msg('Hello World');
  `;
  checkAnalysis(t, src, [
    {
      name: 's3d58dee72d4e0c27',
      contents: ['Hello World'],
    },
  ]);
  t.end();
});

test('HTML message', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('HTML message (auto ID)', (t) => {
  const src = `
    import {msg} from '@lit/localize');
    msg(html\`<b>Hello World</b>\`);
  `;
  checkAnalysis(t, src, [
    {
      name: 'hc468c061c2d171f4',
      contents: [
        {untranslatable: '<b>'},
        'Hello World',
        {untranslatable: '</b>'},
      ],
    },
  ]);
  t.end();
});

test('HTML message with comment', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('parameterized string message', (t) => {
  const src = `
    import {msg, str} from '@lit/localize';
    const name = "friend";
    msg(str\`Hello \${name}\`, {id: 'greeting'});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: ['Hello ', {untranslatable: '${name}'}],
    },
  ]);
  t.end();
});

test('parameterized string message (auto ID)', (t) => {
  const src = `
    import {msg, str} from '@lit/localize';
    const name = "friend";
    msg(str\`Hello \${name}\`);
  `;
  checkAnalysis(t, src, [
    {
      name: 'saed7d3734ce7f09d',
      contents: ['Hello ', {untranslatable: '${name}'}],
    },
  ]);
  t.end();
});

test('parameterized HTML message', (t) => {
  const src = `
    import {msg} from '@lit/localize';
    const name = "Friend";
    msg(html\`<b>Hello \${friend}</b>\`, {id: 'greeting'});
  `;
  checkAnalysis(t, src, [
    {
      name: 'greeting',
      contents: [
        {untranslatable: '<b>'},
        'Hello ',
        {untranslatable: '${friend}</b>'},
      ],
    },
  ]);
  t.end();
});

test('immediate description', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('inherited description', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('different msg function', (t) => {
  const src = `
    function msg(id: string, template: string) {
      return template;
    }
    msg('Greeting', {id: 'greeting'});
  `;
  checkAnalysis(t, src, []);
  t.end();
});

test('error: message id cannot be empty', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('error: options must be object literal', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('error: options must be long-form', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('error: message id must be static', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('error: different message contents', (t) => {
  const src = `
    import {msg} from '@lit/localize';
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
  t.end();
});

test('error: string with expressions must use str tag', (t) => {
  const src = `
    import {msg} from '@lit/localize';
    const name = 'friend';
    msg(\`Hello \${name}\`);
  `;
  checkAnalysis(
    t,
    src,
    [],
    [
      '__DUMMY__.ts(4,9): error TS2324: String literal with expressions must use the str tag',
    ]
  );
  t.end();
});
