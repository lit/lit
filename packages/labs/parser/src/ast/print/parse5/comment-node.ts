import {CommentNode} from '../../html-parser/parse5-shim.js';
import {
  printAttributeArray,
  stringifyLiteralExpressionArray,
} from './helpers.js';

/**
 * Pretty prints a comment node
 */

export function prettyPrintCommentNode({
  node,
  level,
  prefix,
}: {
  node: CommentNode;
  level: number;
  prefix: string;
}): string {
  const lines: string[] = [];
  lines.push(
    `${prefix}COMMENT (loc: ${node?.sourceCodeLocation?.startOffset}, ${node?.sourceCodeLocation?.endOffset})`
  );
  lines.push(
    `${prefix} data (stringified): "${stringifyLiteralExpressionArray(node.data)}"`
  );
  lines.push(`${prefix} data (raw):`);
  lines.push(printAttributeArray(node.data, prefix, level + 1));
  return lines.join('\n');
}
