import {printExpressionStatement} from './expression-statement.js';
import {printTaggedTemplateExpression} from './tagged-template-expression.js';
import {Node} from './types.js';
import {printTemplateLiteral} from './template-literal.js';
import {printIfStatement} from './if-statement.js';
import {printBlockStatement} from './block-statement.js';
import {printFunctionDeclaration} from './function-declaration.js';
import {printTemplateElement} from './template-element.js';
import {printIdentifier} from './identifier.js';
import {printArrowFunctionExpression} from './arrowFunctionExpression.js';
import {printLiteral} from './literal.js';

/**
 * Pretty prints an oxc-parser node.
 *
 * This function was completely reworked to produce a more readable, hierarchical, multi-line output.
 *
 * @param node The node to pretty print
 * @param level The indentation level
 * @param options Options for pretty printing
 * @returns A string representation of the node
 */

export function prettyPrintNode(node: Node, level: number): string {
  const prefix = '  '.repeat(level);
  const lines: string[] = [];

  // Dispatch based on node type for custom formatting.
  switch (node.type) {
    case 'ExpressionStatement':
      printExpressionStatement({lines, prefix, node, level});
      break;
    case 'TaggedTemplateExpression':
      printTaggedTemplateExpression({node, lines, prefix, level});
      break;
    case 'TemplateLiteral':
      printTemplateLiteral({lines, prefix, node, level});
      break;
    case 'TemplateElement':
      printTemplateElement({lines, prefix, node, level});
      break;
    case 'FunctionDeclaration':
      printFunctionDeclaration({lines, prefix, node, level});
      break;
    case 'IfStatement':
      printIfStatement({lines, prefix, node, level});
      break;
    case 'BlockStatement':
      printBlockStatement({lines, node, level});
      break;
    case 'Identifier':
      printIdentifier({lines, prefix, node, level});
      break;
    case 'ArrowFunctionExpression':
      printArrowFunctionExpression({lines, prefix, node, level});
      break;
    case 'Literal':
      printLiteral({lines, prefix, node});
      break;
    default:
      // For other node types, no custom dispatch.
      break;
  }

  return lines.join('\n');
}
