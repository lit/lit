import type {BlockStatement} from 'oxc-parser';
import {prettyPrintNode} from './node.js';

export function printBlockStatement({
  lines,
  node,
  level,
}: {
  lines: string[];
  node: BlockStatement;
  level: number;
}) {
  for (const statement of node.body) {
    lines.push(prettyPrintNode(statement, level));
  }
}
