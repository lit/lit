import {
  DocumentFragment,
  Element,
  TextNode,
  CommentNode,
  Node,
  Document,
  DocumentType,
  Template,
  LitHtmlExpression,
} from '../html-parser/parse5-shim.js';
import {prettyPrintNode} from './parse5/node.js';

/**
 * Pretty prints an AST node
 *
 * @param node The node to pretty print
 * @param options Options for pretty printing
 * @returns A string representation of the AST
 */
export function prettyPrintAst(node: Node): string {
  return prettyPrintNode(node, 0);
}

/**
 * Type guard for DocumentFragment
 */
export function isDocumentFragment(node: Node): node is DocumentFragment {
  return node.nodeName === '#document-fragment';
}

/**
 * Type guard for Document
 */
export function isDocument(node: Node): node is Document {
  return node.nodeName === '#document';
}

/**
 * Type guard for DocumentType
 */
export function isDocumentType(node: Node): node is DocumentType {
  return node.nodeName === '#documentType';
}

/**
 * Type guard for Template
 */
export function isTemplate(node: Node): node is Template {
  return node.nodeName === 'template';
}

export function isLitHtmlExpression(node: Node): node is LitHtmlExpression {
  return node.nodeName === '#lit-html-expression';
}

/**
 * Type guard for Element
 */
export function isElement(node: Node): node is Element {
  return (
    !isDocument(node) &&
    !isDocumentFragment(node) &&
    !isTextNode(node) &&
    !isCommentNode(node) &&
    !isDocumentType(node) &&
    !isTemplate(node) &&
    !isLitHtmlExpression(node)
  );
}

/**
 * Type guard for TextNode
 */
export function isTextNode(node: Node): node is TextNode {
  return node.nodeName === '#text';
}

/**
 * Type guard for CommentNode
 */
export function isCommentNode(node: Node): node is CommentNode {
  return node.nodeName === '#comment';
}
