import {TemplateLiteral} from 'oxc-parser';
import {prettyPrintNode} from './node.js';

export function printTemplateLiteral({
  lines,
  prefix,
  node,
  level,
}: {
  lines: string[];
  prefix: string;
  node: TemplateLiteral;
  level: number;
}) {
  if (node.quasis.length) {
    lines.push(
      `${prefix}  TemplateLiteral (loc: ${node.start}, ${node.end}): [`
    );
    for (const quasi of node.quasis) {
      lines.push(prettyPrintNode(quasi, level + 2));
    }
    lines.push(`${prefix}  ]`);
  }

  if (node.expressions.length) {
    lines.push(`${prefix}  expressions: [`);
    for (const expression of node.expressions) {
      lines.push(prettyPrintNode(expression, level + 2));
    }
    lines.push(`${prefix}  ]`);
  }
}
