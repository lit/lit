import {LitHtmlExpression} from '../../html-parser/parse5-shim.js';
import {prettyPrintNode as oxcPrettyPrintNode} from '../oxc/node.js';

/**
 * Pretty prints a comment node
 */

export function printLitHtmlExpression({
  node,
  prefix,
  level,
}: {
  node: LitHtmlExpression;
  prefix: string;
  level: number;
}): string {
  const lines: string[] = [];
  lines.push(
    `${prefix}LitHtmlExpression (loc: ${node.sourceCodeLocation?.startOffset}, ${node.sourceCodeLocation?.endOffset}):`
  );
  lines.push(oxcPrettyPrintNode(node.value, level + 1));
  return lines.join('\n');
}
