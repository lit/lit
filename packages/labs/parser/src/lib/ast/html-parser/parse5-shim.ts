import type * as p5t from '@parse5/tools';
import type * as p5 from 'parse5/dist/common/token';
import {
  createDocumentFragment as p5tCreateDocumentFragment,
  createCommentNode as p5tCreateCommentNode,
  createTextNode as p5tCreateTextNode,
  createElement as p5tCreateElement,
} from '@parse5/tools';
import {LitLinkedExpression, With} from '../tree-adapter.js';

/**
 * Simplified location type that only includes offset information
 * without line and column data.
 */
export interface SimpleLocation {
  startOffset: number;
  endOffset: number;
}

/**
 * Extended location type for elements that includes attribute locations
 */
export interface SimpleElementLocation extends WithSimpleAttrs<SimpleLocation> {
  startTag?: WithSimpleAttrs<SimpleLocation>;
  endTag?: WithSimpleAttrs<SimpleLocation>;
}

export type WithSimpleAttrs<T> = T extends {attrs?: unknown}
  ? Omit<T, 'attrs'> & {attrs?: Record<string, SimpleLocation>}
  : T & {attrs?: Record<string, SimpleLocation>};

/**
 * Utility type for transforming any parse5 type that uses sourceCodeLocation
 * to use SimpleLocation instead
 */
export type WithSimpleLocation<T> = T extends {sourceCodeLocation?: unknown}
  ? Omit<T, 'sourceCodeLocation'> & {sourceCodeLocation?: SimpleLocation}
  : never;

export type WithChildNodes<T extends {childNodes: p5t.ChildNode[]}> =
  T extends {childNodes: unknown} ? Omit<T, 'childNodes'> : never;

export type WithParentNode<T extends {parentNode: p5t.ParentNode | null}> =
  T extends {parentNode: unknown} ? Omit<T, 'parentNode'> : never;

/**
 * Utility type for transforming any parse5 type that uses elementLocation
 * to use SimpleElementLocation instead
 */
export type WithSimpleElementLocation<T> = T extends {
  sourceCodeLocation?: unknown;
}
  ? Omit<T, 'sourceCodeLocation'> & {sourceCodeLocation?: SimpleElementLocation}
  : never;

/**
 * Base Node with simplified location information
 */
export type Node = ChildNode | ParentNode;

/**
 * DocumentFragment with simplified location information
 */
export type DocumentFragment = WithChildNodes<
  WithSimpleLocation<p5t.DocumentFragment>
> & {
  childNodes: ChildNode[];
};

/**
 * Document with simplified location information
 */
export type Document = WithChildNodes<WithSimpleLocation<p5t.Document>> & {
  childNodes: ChildNode[];
};

/**
 * Template with simplified location information
 */
export type Template = WithParentNode<
  WithChildNodes<WithSimpleElementLocation<p5t.Template>>
> & {
  childNodes: ChildNode[];
  parentNode: ParentNode | null;
};

/**
 * DocumentType with simplified location information
 */
export type DocumentType = WithParentNode<
  WithSimpleElementLocation<p5t.DocumentType>
> & {
  parentNode: ParentNode | null;
};

/**
 * CommentNode with simplified location information
 */
export type CommentNode = Omit<
  WithParentNode<WithSimpleLocation<p5t.CommentNode>>,
  'data'
> & {
  data: (LitTagLiteral | LitHtmlExpression)[];
  parentNode: ParentNode | null;
};

/**
 * TextNode with simplified location information
 */
export type TextNode = WithParentNode<WithSimpleLocation<p5t.TextNode>> & {
  parentNode: ParentNode | null;
};

type NodeName = (LitTagLiteral | LitHtmlExpression)[];

/**
 * Element with simplified location information
 */
export type Element = Omit<
  WithParentNode<WithChildNodes<WithSimpleElementLocation<p5t.Element>>>,
  'nodeName' | 'tagName' | 'attrs'
> & {
  childNodes: ChildNode[];
  parentNode: ParentNode | null;
  attrs: Attribute[];
  tagName: NodeName;
  nodeName: NodeName;
};

interface AttributeBase<T extends string> {
  type: T;
  name: Array<LitTagLiteral | LitHtmlExpression>;
  value: Array<LitTagLiteral | LitHtmlExpression>;
  element: Element;
}

export type LitPropertyAttribute = Omit<p5.Attribute, 'value' | 'name'> &
  AttributeBase<'Property'>;
export type LitBooleanAttribute = Omit<p5.Attribute, 'value' | 'name'> &
  AttributeBase<'Boolean'>;
export type LitStringAttribute = Omit<p5.Attribute, 'value' | 'name'> &
  AttributeBase<'String'>;
export type LitEventAttribute = Omit<p5.Attribute, 'value' | 'name'> &
  AttributeBase<'Event'>;

export interface LitTagLiteral {
  type: 'LitTagLiteral';
  value: string;
  sourceCodeLocation?: SimpleLocation;
}

export type LitHtmlExpression = {
  nodeName: '#lit-html-expression';
  type: 'LitHtmlExpression';
  sourceCodeLocation: SimpleLocation;
  value: With<Object, LitLinkedExpression>;
  element?: Element;
};

export type Attribute =
  | LitPropertyAttribute
  | LitBooleanAttribute
  | LitStringAttribute
  | LitEventAttribute
  | LitHtmlExpression;

export type ParentNode = Document | DocumentFragment | Element | Template;
export type ChildNode =
  | Element
  | Template
  | CommentNode
  | TextNode
  | DocumentType
  | LitHtmlExpression;

export function createDocumentFragment(): DocumentFragment {
  return p5tCreateDocumentFragment() as unknown as DocumentFragment;
}

export function createCommentNode(): CommentNode {
  return p5tCreateCommentNode('') as unknown as CommentNode;
}

export function createTextNode(value: string): TextNode {
  return p5tCreateTextNode(value) as unknown as TextNode;
}

export function createElement(
  tagName: string,
  attrs?: Record<string, string>,
  namespaceURI?: string
): Element {
  return p5tCreateElement(tagName, attrs, namespaceURI) as unknown as Element;
}

export function createLitHtmlExpression(
  value: With<Object, LitLinkedExpression>,
  start: number,
  element?: Element
): LitHtmlExpression {
  const litExpression: LitHtmlExpression = {
    nodeName: '#lit-html-expression',
    type: 'LitHtmlExpression',
    sourceCodeLocation: {
      startOffset: start,
      endOffset: start,
    },
    value,
  };

  if (element) {
    litExpression.element = element;
  }

  value.litHtmlExpression = litExpression;
  return litExpression;
}

/**
 * Creates a new LitTagLiteral with the given value
 * @param value The string value for the literal
 * @returns A new LitTagLiteral
 */
export function createTagLiteral(value: string): LitTagLiteral {
  return {
    type: 'LitTagLiteral',
    value,
  };
}
