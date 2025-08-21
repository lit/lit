import {DocumentFragment} from '../../html-parser/parse5-shim.js';
import {prettyPrintNode} from './node.js';

/**
 * Pretty prints a document fragment
 */

export function prettyPrintDocumentFragment({
  node,
  level,
  prefix,
}: {
  node: DocumentFragment;
  level: number;
  prefix: string;
}): string {
  const lines: string[] = [];
  lines.push(
    `${prefix}DocumentFragment (loc: ${node.sourceCodeLocation?.startOffset}, ${node.sourceCodeLocation?.endOffset}) {`
  );
  if (node.childNodes && node.childNodes.length > 0) {
    for (const child of node.childNodes) {
      lines.push(`${prettyPrintNode(child, level + 1)}`);
    }
  }
  lines.push(`${prefix}}`);
  return lines.join('\n');
}
