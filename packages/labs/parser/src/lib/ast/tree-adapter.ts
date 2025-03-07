import type {
  DocumentFragment,
  LitHtmlExpression,
} from './html-parser/parse5-shim.js';

export interface LitTaggedTemplateExpression {
  isLit: boolean;
  documentFragment: DocumentFragment;
  litHtmlExpression?: LitHtmlExpression;
}

export type LitLinkedExpression = {
  litHtmlExpression: LitHtmlExpression;
};

export type With<T, U> = T & U;
export type MaybeWith<T, U> = T & Partial<U>;

export interface TemplateLiteral {
  spans: TemplateExpression[];
  start: number;
  end: number;
  expressions: With<Object, LitLinkedExpression>[];
}

export interface TaggedTemplateExpression<T extends Object = {}> {
  start: number;
  end: number;
  tagName: string;
  template: TemplateLiteral;
  native: With<T, LitTaggedTemplateExpression>;
}

export interface TemplateExpression {
  start: number;
  end: number;
  value: {
    raw: string;
  };
}

export interface Comment {
  start: number;
  end: number;
  value: string;
}

export type NativeTemplate<T> =
  T extends TreeAdapter<infer U> ? With<U, LitTaggedTemplateExpression> : never;

export interface TreeAdapter<T extends Object = {}> {
  findTaggedTemplateLiterals(): TaggedTemplateExpression<T>[];
  findComments(): Comment[];
}
