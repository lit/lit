/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

import {compileLitTemplates} from '../lib/template-transform.js';

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';

test('basic', () => {
  const source = `
import { html } from 'lit-html';
export const sayHello = (name) => html\`<h1>Hello \${name}\${'!'}</h1>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<h1>Hello <?><?></h1>", parts: [{ type: 2, index: 1 }, { type: 2, index: 2 }] };
export const sayHello = (name) => ({ _$litType$: lit_template_1, values: [name, '!'] });
`.trim()
  );
});

test('basic importing from lit', () => {
  const source = `
import { html } from 'lit';
export const sayHello = (name) => html\`<h1>Hello \${name}\${'!'}</h1>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit';
const lit_template_1 = { h: "<h1>Hello <?><?></h1>", parts: [{ type: 2, index: 1 }, { type: 2, index: 2 }] };
export const sayHello = (name) => ({ _$litType$: lit_template_1, values: [name, '!'] });
`.trim()
  );
});

test('multiple TTLs', () => {
  const source = `
import { html } from 'lit-html';
export const one = html\`<h1>One</h1>\`;
export const two = html\`<h1>Two</h1>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<h1>One</h1>", parts: [] };
export const one = { _$litType$: lit_template_1, values: [] };
const lit_template_2 = { h: "<h1>Two</h1>", parts: [] };
export const two = { _$litType$: lit_template_2, values: [] };
`.trim()
  );
});

test('TTL is only a dynamic binding', () => {
  const source = `
import { html } from 'lit-html';
export const one = html\`\${'potato'}\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<?><?>", parts: [{ type: 2, index: 0 }] };
export const one = { _$litType$: lit_template_1, values: ['potato'] };
`.trim()
  );
});

test('defining multiple TTLs in a function', () => {
  const source = `
import { html } from 'lit-html';
function () {
  const one = html\`<h1 class=\${'class-binding'}>One</h1>\`;
  const two = html\`<h1 class=\${'second-class-binding'}>Two</h1>\`;
}
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { _$LH as litHtmlPrivate_1 } from "lit-html/private-ssr-support.js";
const { AttributePart: _$LH_AttributePart, PropertyPart: _$LH_PropertyPart, BooleanAttributePart: _$LH_BooleanAttributePart, EventPart: _$LH_EventPart } = litHtmlPrivate_1;
import { html } from 'lit-html';
const lit_template_1 = { h: "<h1>One</h1>", parts: [{ type: 1, index: 0, name: "class", strings: ["", ""], ctor: _$LH_AttributePart }] };
const lit_template_2 = { h: "<h1>Two</h1>", parts: [{ type: 1, index: 0, name: "class", strings: ["", ""], ctor: _$LH_AttributePart }] };
function () {
    const one = { _$litType$: lit_template_1, values: ['class-binding'] };
    const two = { _$litType$: lit_template_2, values: ['second-class-binding'] };
}
`.trim()
  );
});

test('ChildPart nodeIndex is correct when separated by textNode', () => {
  const source = `
import { html } from 'lit-html';
const value = html\`<p>\${'a'}:\${1}</p>\`
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<p><?>:<?></p>", parts: [{ type: 2, index: 1 }, { type: 2, index: 2 }] };
const value = { _$litType$: lit_template_1, values: ['a', 1] };
`.trim()
  );
});

test('ElementPart position is compiled', () => {
  const source = `
import { html } from 'lit-html';
const one = html\`<input \${'element-part'}>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { _$LH as litHtmlPrivate_1 } from "lit-html/private-ssr-support.js";
const { AttributePart: _$LH_AttributePart, PropertyPart: _$LH_PropertyPart, BooleanAttributePart: _$LH_BooleanAttributePart, EventPart: _$LH_EventPart } = litHtmlPrivate_1;
import { html } from 'lit-html';
const lit_template_1 = { h: "<input>", parts: [{ type: 6, index: 0 }] };
const one = { _$litType$: lit_template_1, values: ['element-part'] };
`.trim()
  );
});

test('TemplateResult compiled into module scope from inner scope', () => {
  const source = `
import { html, nothing } from 'lit-html';

{
  function outside() {
    function inner() {
      return html\`<p>Hi</p>\`;
    }
  }
}
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<p>Hi</p>", parts: [] };
{
    function outside() {
        function inner() {
            return { _$litType$: lit_template_1, values: [] };
        }
    }
}
`.trim()
  );
});

test('Nested TemplateResults passed into each other correctly', () => {
  const source = `
import { html } from 'lit-html';

const inner = () => html\`<p>Inner</p>\`;
const outer = () => html\`<div>\${inner()}</div>\`
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<p>Inner</p>", parts: [] };
const inner = () => ({ _$litType$: lit_template_1, values: [] });
const lit_template_2 = { h: "<div><?></div>", parts: [{ type: 2, index: 1 }] };
const outer = () => ({ _$litType$: lit_template_2, values: [inner()] });
`.trim()
  );
});

test('BooleanAttributePart compiled correctly', () => {
  const source = `
import { html } from 'lit-html';
const booleanAttributePart = html\`<div ?data-attr="\${true}"></div>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { _$LH as litHtmlPrivate_1 } from "lit-html/private-ssr-support.js";
const { AttributePart: _$LH_AttributePart, PropertyPart: _$LH_PropertyPart, BooleanAttributePart: _$LH_BooleanAttributePart, EventPart: _$LH_EventPart } = litHtmlPrivate_1;
import { html } from 'lit-html';
const lit_template_1 = { h: "<div></div>", parts: [{ type: 1, index: 0, name: "data-attr", strings: ["", ""], ctor: _$LH_BooleanAttributePart }] };
const booleanAttributePart = { _$litType$: lit_template_1, values: [true] };
`.trim()
  );
});

test('Ignore html tag imported from lit-html/static.js', () => {
  const source = `
import { html, literal } from 'lit-html/static.js';
import { render } from 'lit';
render(html \`\${literal \`<p>Hello</p>\`}\`, container);
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(result.outputText.trim(), source.trim());
});

test('Inlined nested html ttls', () => {
  const source = `
import {html} from 'lit-html';
import {cache} from 'lit-html/directives/cache.js';

const template = html\`<div>\${html\`'potato'\`}</div>\`;
`;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<div><?></div>", parts: [{ type: 2, index: 1 }] };
const lit_template_2 = { h: "'potato'", parts: [] };
const template = { _$litType$: lit_template_1, values: [{ _$litType$: lit_template_2, values: [] }] };
`.trim()
  );
});

test('Do not duplicate Part constructors if identifiers collide', () => {
  const source = `
import { html } from 'lit-html';
import { _$LH as litHtmlPrivate } from "lit-html/private-ssr-support.js";

const BooleanAttributePart = false;

const booleanAttributePart = html\`<div ?data-attr="\${true}"></div>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { _$LH as litHtmlPrivate_1 } from "lit-html/private-ssr-support.js";
const { AttributePart: _$LH_AttributePart, PropertyPart: _$LH_PropertyPart, BooleanAttributePart: _$LH_BooleanAttributePart, EventPart: _$LH_EventPart } = litHtmlPrivate_1;
import { html } from 'lit-html';
const BooleanAttributePart = false;
const lit_template_1 = { h: "<div></div>", parts: [{ type: 1, index: 0, name: "data-attr", strings: ["", ""], ctor: _$LH_BooleanAttributePart }] };
const booleanAttributePart = { _$litType$: lit_template_1, values: [true] };
`.trim()
  );
});

// TODO: In the future we can figure out a way to correctly compile raw text
// elements. The complexity is that they depend on creating adjacent Text nodes
// which cannot be represented in the prepared HTML.
test('raw text elements with any bindings are not compiled', () => {
  const source = `
import { html } from 'lit-html';

const scriptTemplateNoBinding = html\`<script>potato</script>\`;
const styleTemplateNoBinding = html\`<style>carrot</style>\`;
const textareaTemplateNoBinding = html\`<textarea>tomato</textarea>\`;
const titleTemplateNoBinding = html\`<title>avocado</title>\`;

const scriptTemplateOneBinding = html\`<script>\${'potato'}</script>\`;
const styleTemplateOneBinding = html\`<style>\${'carrot'}</style>\`;
const textareaTemplateOneBinding = html\`<textarea>\${'tomato'}</textarea>\`;
const titleTemplateOneBinding = html\`<title>\${'avocado'}</title>\`;

const scriptTemplateShouldNotBeCompiled = html\`<script>potato \${'tomato'}</script>\`;
const styleTemplateShouldNotBeCompiled = html\`<style>\${''} carrot \${''}</style>\`;
const textareaTemplateShouldNotBeCompiled = html\`<textarea>\${''}\${''}</textarea>\`;
const titleTemplateShouldNotBeCompiled = html\`<title> \${''} </title>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<script>potato</script>", parts: [] };
const scriptTemplateNoBinding = { _$litType$: lit_template_1, values: [] };
const lit_template_2 = { h: "<style>carrot</style>", parts: [] };
const styleTemplateNoBinding = { _$litType$: lit_template_2, values: [] };
const lit_template_3 = { h: "<textarea>tomato</textarea>", parts: [] };
const textareaTemplateNoBinding = { _$litType$: lit_template_3, values: [] };
const lit_template_4 = { h: "<title>avocado</title>", parts: [] };
const titleTemplateNoBinding = { _$litType$: lit_template_4, values: [] };
const scriptTemplateOneBinding = html \`<script>\${'potato'}</script>\`;
const styleTemplateOneBinding = html \`<style>\${'carrot'}</style>\`;
const textareaTemplateOneBinding = html \`<textarea>\${'tomato'}</textarea>\`;
const titleTemplateOneBinding = html \`<title>\${'avocado'}</title>\`;
const scriptTemplateShouldNotBeCompiled = html \`<script>potato \${'tomato'}</script>\`;
const styleTemplateShouldNotBeCompiled = html \`<style>\${''} carrot \${''}</style>\`;
const textareaTemplateShouldNotBeCompiled = html \`<textarea>\${''}\${''}</textarea>\`;
const titleTemplateShouldNotBeCompiled = html \`<title> \${''} </title>\`;
`.trim()
  );
});

test('do not compile templates with invalid "dynamic" tag name', () => {
  const source = `
import { html } from 'lit-html';
const template = html\`<\${'A'}></\${'A'}>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.fixture(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const template = html \`<\${'A'}></\${'A'}>\`;
`.trim()
  );
});

test.run();
