import {TextNode} from '../../html-parser/parse5-shim.js';

/**
 * Pretty prints a text node
 */

export function prettyPrintTextNode({
  node,
  prefix,
}: {
  node: TextNode;
  prefix: string;
}): string {
  return `${prefix}TEXT (loc: ${node.sourceCodeLocation?.startOffset}, ${node.sourceCodeLocation?.endOffset})
${prefix}  value: "${node.value.replaceAll('\n', '\\n')}"`;
}
