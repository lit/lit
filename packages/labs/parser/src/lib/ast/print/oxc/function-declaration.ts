import type {Function} from 'oxc-parser';
import {prettyPrintNode} from './node.js';

export function printFunctionDeclaration({
  lines,
  prefix,
  node,
  level,
}: {
  lines: string[];
  prefix: string;
  node: Function;
  level: number;
}) {
  lines.push(`${prefix}Function {`);
  for (const child of node.body?.body || []) {
    lines.push(prettyPrintNode(child, level + 1));
  }
  lines.push(`${prefix}}`);
}
