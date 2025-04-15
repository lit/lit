import {Attribute, SimpleLocation} from '../../html-parser/parse5-shim.js';
import {prettyPrintNode as oxcPrettyPrintNode} from '../oxc/node.js';
import {
  printAttributeArray,
  stringifyLiteralExpressionArray,
} from './helpers.js';

export function printAttribute({
  node,
  location,
  level,
  prefix,
}: {
  node: Attribute;
  location: SimpleLocation;
  level: number;
  prefix: string;
}): string {
  const lines: string[] = [];
  switch (node.type) {
    case 'LitHtmlExpression':
      lines.push(oxcPrettyPrintNode(node.value, level + 1));
      break;
    default:
      lines.push(
        `${prefix}ATTRIBUTE (loc: ${location.startOffset}, ${location.endOffset}):`
      );
      lines.push(`${prefix}  type: ${node.type}`);
      lines.push(
        `${prefix}  name (stringified): ${stringifyLiteralExpressionArray(node.name)}`
      );
      lines.push(
        printAttributeArray(node.name, prefix, level + 1, 'name (raw)')
      );
      if (node.value.length) {
        lines.push(printAttributeArray(node.value, prefix, level));
      }
      break;
  }

  return lines.join('\n');
}
