import type {IfStatement} from 'oxc-parser';
import {prettyPrintNode} from './node.js';

export function printIfStatement({
  lines,
  prefix,
  node,
  level,
}: {
  lines: string[];
  prefix: string;
  node: IfStatement;
  level: number;
}) {
  lines.push(`${prefix}  IfStatement {`);
  lines.push(prettyPrintNode(node.consequent, level + 1));
  lines.push(`${prefix}  }`);
}
