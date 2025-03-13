import type {Directive, Statement} from 'oxc-parser';
import {prettyPrintNode} from './node.js';

/**
 * Pretty prints an oxc-parser AST
 *
 * @param ast The AST to pretty print
 * @param options Options for pretty printing
 * @returns A string representation of the AST
 */

export function prettyPrintAst(ast: (Directive | Statement)[]): string {
  let result = 'Program {\n';
  for (const node of ast) {
    result += prettyPrintNode(node, 0) + '\n';
  }
  result += '}';
  return result;
}
