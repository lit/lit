import {
  Attribute,
  CommentNode,
  DocumentFragment,
  Element,
  LitHtmlExpression,
  LitTagLiteral,
  TextNode,
} from './parse5-shim.js';

export const Mode = {
  TEXT: 'TEXT',
  TAG_OR_COMMENT_OR_TEXT_OR_END_TAG: 'TAG_OR_COMMENT_OR_TEXT_OR_END_TAG',
  TAG_NAME: 'TAG_NAME',
  COMMENT: 'COMMENT',
  TAG: 'TAG',
  CLOSING_TAG: 'CLOSING_TAG',
  ATTRIBUTE: 'ATTRIBUTE',
  ATTRIBUTE_EQUALS_OR_TAG: 'ATTRIBUTE_EQUALS_OR_TAG',
  ATTRIBUTE_VALUE: 'ATTRIBUTE_VALUE',
} as const;

export type Mode = (typeof Mode)[keyof typeof Mode];

export const AttributeMode = {
  STRING: 'String',
  PROPERTY: 'Property',
  BOOLEAN: 'Boolean',
  EVENT: 'Event',
} as const;

export type AttributeMode = (typeof AttributeMode)[keyof typeof AttributeMode];

export interface State {
  mode: Mode;
  attributeMode: AttributeMode | null;
  elementStack: Element[];
  document: DocumentFragment;
  charLocation: number;
  endTagIgnore: boolean;
  potentialTextNode: TextNode | null;
  commentIsBogus: boolean;
  checkingSecondDash: boolean;
  lastExpressionNode: LitHtmlExpression | null;
  currentAttributeQuote: '"' | "'" | null;
  currentElementNode: Element | null;
  currentAttributeNode: Exclude<Attribute, LitHtmlExpression> | null;
  currentTextNode: TextNode | null;
  currentCommentNode: CommentNode | null;
  currentEndTag: Array<LitTagLiteral | LitHtmlExpression>;
  currentTagLiteral: LitTagLiteral | null;
}
