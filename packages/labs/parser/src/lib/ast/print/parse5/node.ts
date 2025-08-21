import {Node} from '../../html-parser/parse5-shim.js';
import {prettyPrintCommentNode} from './comment-node.js';
import {prettyPrintTextNode} from './text-node.js';
import {prettyPrintElement} from './element.js';
import {prettyPrintDocumentFragment} from './document-fragment.js';
import {isElement} from '../helpers.js';
import {printLitHtmlExpression} from './lit-element-expression.js';

/**
 * Pretty prints a node with the given indentation level.
 *
 * This function dispatches based on node type.
 *
 * @param node The node to pretty print
 * @param level The indentation level
 * @param options Options for pretty printing
 * @returns A string representation of the node
 */

export function prettyPrintNode(node: Node, level: number): string {
  const prefix = '  '.repeat(level);
  if (isElement(node)) {
    return prettyPrintElement({node, level, prefix});
  }

  switch (node.nodeName) {
    case '#document-fragment':
      return prettyPrintDocumentFragment({node, level, prefix});
    case '#text':
      return prettyPrintTextNode({node, prefix});
    case '#comment':
      return prettyPrintCommentNode({node, level, prefix});
    case '#lit-html-expression':
      return printLitHtmlExpression({node, level, prefix});
    default:
      return '';
  }
}
