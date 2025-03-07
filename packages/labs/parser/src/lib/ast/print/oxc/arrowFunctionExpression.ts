import type {ArrowFunctionExpression} from 'oxc-parser';
import {prettyPrintNode} from './node.js';

export function printArrowFunctionExpression({
  lines,
  prefix,
  node,
  level,
}: {
  lines: string[];
  prefix: string;
  node: ArrowFunctionExpression;
  level: number;
}) {
  lines.push(`${prefix}ArrowFunction (loc: ${node.start}, ${node.end}) {`);
  lines.push(prettyPrintNode(node.body, level + 1));
  lines.push(`${prefix}}`);
}
