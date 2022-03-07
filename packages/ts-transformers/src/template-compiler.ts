/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

import type {TemplateResult} from 'lit';

import {
  parseTemplateResult,
  Node,
  ChildNode,
  ParentNode,
  Attribute,
  CommentNode,
  Element,
  DocumentFragment,
  hasChildPart,
  isElement,
  hasAttributePart,
  traverse,
  isCommentNode,
  isTextNode,
} from '@lit-labs/ssr/lib/template-parser';

declare module '@lit-labs/ssr/lib/template-parser' {
  interface PartInfo {
    values: ts.Expression[];
  }
}

interface PluginConfig {
  compileSlots?: boolean;
  compileSlotted?: boolean;
}

export function templateCompilerTransformer(
  config: PluginConfig = {
    compileSlots: true,
    compileSlotted: true,
  }
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    return (file) => {
      const transformer = new TemplateCompilerTransformer(
        context.factory,
        config
      );
      const visit = (node: ts.Node): ts.Node => {
        node = transformer.visit(node);
        return ts.visitEachChild(node, visit, context);
      };
      return ts.visitNode(file, visit);
    };
  };
}

/**
 * We create one of these per file.
 */
class TemplateCompilerTransformer {
  private _factory: ts.NodeFactory;
  private _config: PluginConfig;

  constructor(factory: ts.NodeFactory, config: PluginConfig) {
    this._factory = factory;
    this._config = config;
  }

  visit(node: ts.Node): ts.Node {
    switch (node.kind) {
      case ts.SyntaxKind.TaggedTemplateExpression:
        return this.visitTaggedTemplateExpression(
          node as ts.TaggedTemplateExpression
        );
    }
    return node;
  }

  visitTaggedTemplateExpression(node: ts.TaggedTemplateExpression): ts.Node {
    const factory = this._factory;
    const type = getTemplateResultType(node);
    if (type !== undefined) {
      const result = templateResultFromTaggedTemplateExpression(type, node);
      const {ast} = parseTemplateResult(result, withValues(result.values));
      if (this._config.compileSlotted) {
        traverse(ast, slottedNodesToRenderProps(factory));
      }
      if (this._config.compileSlots) {
        traverse(ast, slotsToRenderProps(factory));
      }
      return createTaggedTemplateExpressionFromAst(type, ast, factory);
    }
    return node;
  }
}

function getTemplateResultType({
  tag,
}: ts.TaggedTemplateExpression): number | undefined {
  if (ts.isIdentifier(tag)) {
    switch (tag.text) {
      case 'html':
        return 0;
      case 'svg':
        return 1;
    }
  }
  return undefined;
}

function withValues(values: unknown[]) {
  return {
    pre(node: Node) {
      if (hasChildPart(node)) {
        node.litPart.values = [
          values[node.litPart.valueIndex] as ts.Expression,
        ];
      } else if (isElement(node)) {
        for (const attr of node.attrs) {
          if (hasAttributePart(attr)) {
            attr.litPart.values = values.slice(
              attr.litPart.valueIndex,
              attr.litPart.valueIndex + attr.litPart.strings.length - 1
            ) as ts.Expression[];
          }
        }
      }
    },
  };
}

function getAttr(node: Element, name: string) {
  return node.attrs.find((attr) => attr.name === name)?.value ?? null;
}

function slotsToRenderProps(factory: ts.NodeFactory) {
  const slots: Map<string, ChildNode> = new Map();
  return {
    pre(node: Node) {
      if (isElement(node) && node.tagName === 'slot') {
        slots.set(getAttr(node, 'name') ?? 'default', node);
      }
    },
    post(_node: Node, parent: ParentNode | undefined) {
      if (parent === undefined) {
        for (const [name, node] of slots) {
          const renderProp = factory.createPropertyAccessChain(
            /* expression */ factory.createPropertyAccessExpression(
              /* expression */ factory.createThis(),
              /* name */ factory.createIdentifier('__renderProps')
            ),
            /* questionDotToken */ factory.createToken(
              ts.SyntaxKind.QuestionDotToken
            ),
            name
          );
          addChildPart(node.parentNode, node, renderProp);
          removeNode(node);
        }
      }
    },
  };
}

function slottedNodesToRenderProps(factory: ts.NodeFactory) {
  const customElements: Element[] = [];
  return {
    pre(node: Node) {
      if (
        isElement(node) &&
        node.tagName.includes('-') &&
        node.childNodes.length > 0
      ) {
        customElements.push(node);
      }
    },
    post(_node: Node, parent: ParentNode | undefined) {
      if (parent === undefined) {
        for (const node of customElements) {
          const slots: {[index: string]: DocumentFragment} = {};
          for (const child of [...node.childNodes]) {
            removeNode(child);
            const slotName =
              (isElement(child) && getAttr(child, 'slot')) || 'default';
            const slotFragment = (slots[slotName] ??= createDocumentFragment());
            insertNode(child, slotFragment);
          }
          const value = factory.createObjectLiteralExpression(
            /* properties */ Object.entries(slots).map(([slotName, ast]) =>
              factory.createPropertyAssignment(
                /* name */ slotName,
                /* initializer */ createTaggedTemplateExpressionFromAst(
                  0,
                  ast,
                  factory
                )
              )
            )
          );
          addPropertyPart(node, '__renderSlots', value);
        }
      }
    },
  };
}

function addPropertyPart(node: Element, name: string, value: ts.Expression) {
  const attr: Attribute = {
    name,
    value: '',
  };
  node.attrs.push(attr);
  attr.litPart = {
    name,
    prefix: '.',
    type: 3, // PartType.PROPERTY_PART
    strings: ['', ''],
    values: [value],
    valueIndex: -1,
  };
}

function addChildPart(
  parentNode: ParentNode,
  refNode: ChildNode | undefined,
  value: ts.Expression
) {
  const comment = createCommentNode();
  comment.litPart = {
    type: 2, // PartType.CHILD_PART
    valueIndex: -1,
    values: [value],
  };
  insertNode(comment, parentNode, refNode);
}

function removeNode(node: ChildNode) {
  const parent = node.parentNode;
  if (parent !== undefined) {
    const idx = parent.childNodes.indexOf(node);
    parent.childNodes.splice(idx, 1);
    node.parentNode = undefined as unknown as ParentNode;
  }
}

function insertNode(node: ChildNode, parent: ParentNode, refNode?: ChildNode) {
  removeNode(node);
  if (refNode) {
    const idx = parent.childNodes.indexOf(refNode);
    parent.childNodes.splice(idx, 0, node);
  } else {
    parent.childNodes.push(node);
  }
  node.parentNode = parent;
}

function createDocumentFragment(): DocumentFragment {
  return {
    nodeName: '#document-fragment',
    childNodes: [],
  };
}

function createCommentNode(data = ''): CommentNode {
  return {
    nodeName: '#comment',
    data,
  } as unknown as CommentNode;
}

function toTemplateStringsArray(strings: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (strings as any).raw = strings;
  return strings;
}

function templateResultFromTaggedTemplateExpression(
  type: number,
  expr: ts.TaggedTemplateExpression
): TemplateResult {
  const template = expr.template;
  const strings = ts.isNoSubstitutionTemplateLiteral(template)
    ? [template.text]
    : [
        template.head.text,
        ...template.templateSpans.map((s) => s.literal.text),
      ];
  const values = ts.isNoSubstitutionTemplateLiteral(template)
    ? []
    : template.templateSpans.map((s) => s.expression);
  return {
    _$litType$: type,
    strings: toTemplateStringsArray(strings),
    values: values,
  } as unknown as TemplateResult;
}

function serializer(strings: string[], values: ts.Expression[]) {
  let acc = '';
  const addString = (s: string) => (acc += s);
  const addPart = (value: ts.Expression) => {
    strings.push(acc);
    values.push(value);
    acc = '';
  };
  const done = () => strings.push(acc);
  return {
    pre(node: Node) {
      if (isCommentNode(node)) {
        if (hasChildPart(node)) {
          addPart(node.litPart.values[0]!);
        } else if (node.data !== '?') {
          addString(`<!--${node.data}-->`);
        }
      } else if (isElement(node)) {
        addString(`<${node.tagName}`);
        for (const attr of node.attrs) {
          if (hasAttributePart(attr)) {
            const {litPart} = attr;
            addString(
              ` ${litPart.prefix}${litPart.name}="${litPart.strings[0]}`
            );
            litPart.values.forEach((v, i) => {
              addPart(v);
              addString(litPart.strings[i + 1]!);
            });
            addString(`"`);
          } else {
            addString(` ${attr.name}="${attr.value}"`);
          }
        }
        addString(`>`);
      } else if (isTextNode(node)) {
        addString(node.value);
      }
    },
    post(node: Node, parent: ParentNode | undefined) {
      if (isElement(node)) {
        addString(`</${node.tagName}>`);
      }
      if (parent === undefined) {
        done();
      }
    },
  };
}

function createTaggedTemplateExpressionFromAst(
  type: number,
  ast: Node,
  factory: ts.NodeFactory
) {
  return factory.createTaggedTemplateExpression(
    /* tag */ factory.createIdentifier(type === 0 ? 'html' : 'svg'),
    /* typeArguments */ undefined,
    /* template */ createTemplateLiteralFromAst(ast, factory)
  );
}

function createTemplateLiteralFromAst(
  ast: Node,
  factory: ts.NodeFactory
): ts.TemplateLiteral {
  const strings: string[] = [];
  const values: ts.Expression[] = [];
  traverse(ast, serializer(strings, values));
  if (strings.length - 1 !== values.length) {
    throw new Error(
      `strings[${strings.length}] and values[${values.length}] do not agree`
    );
  }
  if (strings.length === 1) {
    return factory.createNoSubstitutionTemplateLiteral(strings[0]!);
  } else {
    return factory.createTemplateExpression(
      /* head */ factory.createTemplateHead(strings.shift()!),
      /* templateSpans */
      strings.map((s, i) =>
        factory.createTemplateSpan(
          /* expression */ values[i]!,
          /* literal */ i < strings.length - 1
            ? factory.createTemplateMiddle(s)
            : factory.createTemplateTail(s)
        )
      )
    );
  }
}
