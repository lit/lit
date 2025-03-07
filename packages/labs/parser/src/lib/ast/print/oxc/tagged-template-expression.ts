import type {IdentifierName, TaggedTemplateExpression} from 'oxc-parser';
import {isLitTaggedTemplateExpression} from '../../estree/helpers.js';
import {With, LitTaggedTemplateExpression} from '../../tree-adapter.js';
import {prettyPrintNode} from './node.js';
import {prettyPrintNode as prettyPrintp5Node} from '../parse5/node.js';

export function printTaggedTemplateExpression({
  node,
  lines,
  prefix,
  level,
}: {
  node:
    | TaggedTemplateExpression
    | With<TaggedTemplateExpression, LitTaggedTemplateExpression>;
  lines: string[];
  prefix: string;
  level: number;
}) {
  const isLit = isLitTaggedTemplateExpression(node);
  console.log(node);
  lines.push(
    `${prefix}${isLit ? 'Lit' : ''}TaggedTemplateExpression (loc: ${node.start}, ${node.end}) {`
  );
  lines.push(`${prefix}  tag: ${(node.tag as IdentifierName)?.name || '???'},`);

  lines.push(`${prefix}  quasi: [`);
  lines.push(prettyPrintNode(node.quasi, level + 1));
  lines.push(`${prefix}  ],`);

  if (isLit) {
    lines.push(prettyPrintp5Node(node.documentFragment, level + 1));
  }
  lines.push(`${prefix}}`);
}
