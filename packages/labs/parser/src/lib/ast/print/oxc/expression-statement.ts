import type {ExpressionStatement} from 'oxc-parser';
import {prettyPrintNode} from './node.js';

export function printExpressionStatement({
  lines,
  prefix,
  node,
  level,
}: {
  lines: string[];
  prefix: string;
  node: ExpressionStatement;
  level: number;
}) {
  const expression = node.expression;
  lines.push(`${prefix}ExpressionStatement {`);
  lines.push(prettyPrintNode(expression, level + 1));
  lines.push(`${prefix}}`);
}
