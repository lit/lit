import oxc from 'oxc-parser';
import {transformTree} from './ast/transform-tree.js';
// import {prettyPrintAst} from './ast/print/oxc/ast.js';
import {ESTreeTreeAdapter} from './ast/tree-adapters/oxc-estree.js';
import {createSourceFile, ScriptTarget} from 'typescript';
import {TsTreeAdapter} from './ast/tree-adapters/ts-ast.js';

export function parseAst(
  filename: string,
  sourceText: string,
  infer: {htmlTag: boolean; litBindings: boolean} = {
    htmlTag: true,
    litBindings: true,
  }
) {
  // typescript
  console.log('TYPESCRIPT');
  const tsResult = createSourceFile(
    filename,
    sourceText,
    ScriptTarget.ESNext,
    true
  );
  const tsTree = new TsTreeAdapter(tsResult);
  const tsTemplates = transformTree({tree: tsTree, sourceText, infer});
  tsTemplates.forEach((template) => {
    console.log(
      template.documentFragment.childNodes.map((node) => {
        if (typeof node.nodeName === 'string') {
          return node;
        }
        return node.attrs;
      })
    );
  });

  // estree
  console.log('ESTREE');
  const result = oxc.parseSync(filename, sourceText, {
    preserveParens: true,
  });
  const tree = new ESTreeTreeAdapter(result);
  const templates = transformTree({tree, sourceText, infer});
  // console.log(prettyPrintAst(result.program.body));
  return [templates, tsTemplates];
}

// parseAst('foo.ts', `html\`<!-- as\${s}df -->\``);
parseAst('foo', 'html`<div .asdf=${55}>${3}</div>`');
// parseAst('foo.ts', `html\`asdf<div asdf="qwer" .prop=\${3} ?bool=\${true} @event=\${() => {}} attr="asdf \${123}">Hello \${'world'}</div>\``);

// parseAst(
//   'foo.ts',
//   `
// // # asdf
// function html (strings: TemplateStringsArray, ...values: unknown[]) {
// }
// const asdf = 3;

// html\`
//   <div>\${asdf}</div>
//   <div>\${html\`
//     <span>\${asdf}</span>
//   \`}</div>
//   <div>\${() => asdf}</div>
// \`;

// html\`asdf\`

// 'asdf'

// @asdf()
// function zzz() {

//   html\`
//   <div>\${asdf}</div>
//   <div>\${
//   html\`
//     <span>\${asdf}</span>
//   \`}</div>
//   <div>\${() => asdf}</div>
// \`;

// html\`asdf\`
// }

// if (false) {
//   html\`
//   <div>\${asdf}</div>
//   <div>\${html\`
//     <span>\${asdf}</span>
//   \`}</div>
//   <div>\${() => asdf}</div>
// \`;

// htmlz\`asdf <div .a-s-df=\${333}></div>\`
// htmlz\`asdf <\${asdf}></div>\`

// htmlz\`asdf\`

// htmlf\`asdf\`
// }
// `
// );
