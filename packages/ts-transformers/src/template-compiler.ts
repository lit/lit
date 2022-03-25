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

interface TransformerContext {
  needsUpgradeImport?: boolean;
}

export function templateCompilerTransformer(
  config: PluginConfig = {
    compileSlots: true,
    compileSlotted: true,
  }
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    return (file) => {
      const transformers: typeof BaseTransformer[] = [
        ScopingClassTransformer,
        SlottedNodesTransformer,
        SlotTransformer,
        UpgradeTransformer,
        UpgradeImportTransformer,
      ];
      const transformContext = {};
      for (const Transformer of transformers) {
        const transformer = new Transformer(
          context.factory,
          config,
          transformContext
        );
        const visit = (node: ts.Node): ts.Node => {
          node = transformer.visit(node);
          node = ts.visitEachChild(node, visit, context);
          node = transformer.visitEnd(node);
          return node;
        };
        file = ts.visitNode(file, visit);
      }
      return file;
    };
  };
}

class BaseTransformer {
  protected _factory: ts.NodeFactory;
  protected _config: PluginConfig;
  protected _context: TransformerContext;

  constructor(
    factory: ts.NodeFactory,
    config: PluginConfig,
    context: TransformerContext
  ) {
    this._factory = factory;
    this._config = config;
    this._context = context;
  }

  visit(node: ts.Node): ts.Node {
    switch (node.kind) {
      case ts.SyntaxKind.SourceFile:
        return this.visitSourceFile(node as ts.SourceFile);
      case ts.SyntaxKind.TaggedTemplateExpression:
        return this.visitTaggedTemplateExpression(
          node as ts.TaggedTemplateExpression
        );
      case ts.SyntaxKind.ClassDeclaration:
        return this.visitClassDeclaration(node as ts.ClassDeclaration);
    }
    return node;
  }

  visitEnd(node: ts.Node): ts.Node {
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
        return this.visitClassDeclarationEnd(node as ts.ClassDeclaration);
    }
    return node;
  }

  visitSourceFile(node: ts.SourceFile): ts.Node {
    return node;
  }

  visitClassDeclaration(node: ts.ClassDeclaration) {
    return node;
  }

  visitClassDeclarationEnd(node: ts.ClassDeclaration) {
    return node;
  }

  visitTaggedTemplateExpression(node: ts.TaggedTemplateExpression): ts.Node {
    const factory = this._factory;
    const type = getTemplateResultType(node);
    if (type !== undefined) {
      const result = templateResultFromTaggedTemplateExpression(type, node);
      const {ast} = parseTemplateResult(result, withValues(result.values));
      this.visitHtmlStart(ast);
      traverse(ast, {
        pre: (node: Node, parent?: ParentNode) =>
          this.visitHtmlNodeOpen(node, parent),
        post: (node: Node, parent?: ParentNode) => {
          this.visitHtmlNodeClose(node, parent);
          if (parent === undefined) {
            this.visitHtmlEnd(node);
          }
        },
      });
      return createTaggedTemplateExpressionFromAst(type, ast, factory);
    }
    return node;
  }

  visitHtmlNodeOpen(_node: Node, _parent?: ParentNode) {}

  visitHtmlNodeClose(_node: Node, _parent?: ParentNode) {}

  visitHtmlStart(_ast: Node) {}

  visitHtmlEnd(_ast: Node) {}
}

class SlotTransformer extends BaseTransformer {
  slots: Map<string, ChildNode>[] = [];

  override visitHtmlStart() {
    this.slots.unshift(new Map());
  }

  override visitHtmlNodeOpen(node: Node) {
    if (isElement(node) && node.tagName === 'slot') {
      this.slots[0]!.set(getAttr(node, 'name') ?? 'default', node);
    }
  }

  override visitHtmlEnd(ast: Node) {
    for (const [name, node] of this.slots[0]!) {
      const renderProp = this._factory.createPropertyAccessChain(
        /* expression */ this._factory.createPropertyAccessExpression(
          /* expression */ this._factory.createThis(),
          /* name */ this._factory.createIdentifier('__renderSlots')
        ),
        /* questionDotToken */ this._factory.createToken(
          ts.SyntaxKind.QuestionDotToken
        ),
        name
      );
      addChildPart(node.parentNode ?? ast, node, renderProp);
      removeNode(node);
    }
    this.slots.shift();
  }
}

class SlottedNodesTransformer extends BaseTransformer {
  customElements: Element[][] = [];

  override visitHtmlStart() {
    this.customElements.unshift([]);
  }

  override visitHtmlNodeOpen(node: Node) {
    if (
      isElement(node) &&
      node.tagName.includes('-') &&
      node.childNodes.length > 0
    ) {
      this.customElements[0]!.push(node);
    }
  }

  override visitHtmlEnd() {
    for (const node of this.customElements[0]!) {
      const slots: {[index: string]: DocumentFragment} = {};
      for (const child of [...node.childNodes]) {
        removeNode(child);
        const slotName =
          (isElement(child) && getAttr(child, 'slot')) || 'default';
        const slotFragment = (slots[slotName] ??= createDocumentFragment());
        insertNode(child, slotFragment);
      }
      const value = this._factory.createObjectLiteralExpression(
        /* properties */ Object.entries(slots).map(([slotName, ast]) =>
          this._factory.createPropertyAssignment(
            /* name */ slotName,
            /* initializer */ createTaggedTemplateExpressionFromAst(
              0,
              ast,
              this._factory
            )
          )
        )
      );
      addPropertyPart(node, '__renderSlots', value);
    }
    this.customElements.shift();
  }
}

const getTagNameForClass = (node: ts.ClassDeclaration) => {
  for (const {expression: fn} of node.decorators ?? []) {
    if (
      ts.isCallExpression(fn) &&
      ts.isIdentifier(fn.expression) &&
      fn.expression.text === 'customElement' &&
      fn.arguments[0] &&
      ts.isStringLiteral(fn.arguments[0])
    ) {
      return fn.arguments[0].text;
    }
  }
  return undefined;
};

class ScopingClassTransformer extends BaseTransformer {
  customElementScope: string[] = [];

  get currentScope() {
    return this.customElementScope[this.customElementScope.length - 1];
  }

  override visitClassDeclaration(node: ts.ClassDeclaration) {
    const scope = getTagNameForClass(node);
    if (scope) {
      this.customElementScope.push(scope);
    }
    return node;
  }

  override visitClassDeclarationEnd(node: ts.ClassDeclaration) {
    const scope = getTagNameForClass(node);
    if (scope) {
      this.customElementScope.pop();
    }
    return node;
  }

  override visitHtmlNodeOpen(node: Node) {
    if (this.currentScope && isElement(node)) {
      const scopingClasses = `style-scope ${this.currentScope}`;
      let attr;
      if ((attr = node.attrs.find((attr) => attr.name === 'class'))) {
        attr.value += ' ' + scopingClasses;
      } else if (
        (attr = node.attrs.find((attr) => attr.litPart?.name === 'class'))
      ) {
        attr.litPart!.strings[attr.litPart!.strings.length - 1] +=
          ' ' + scopingClasses;
      } else {
        node.attrs.push({
          name: 'class',
          value: scopingClasses,
        });
      }
    }
  }
}

class UpgradeTransformer extends BaseTransformer {
  override visitHtmlNodeOpen(node: Node) {
    if (isElement(node) && node.nodeName.includes('-')) {
      this._context.needsUpgradeImport = true;
      addElementPart(
        node,
        this._factory.createCallExpression(
          /* expression */ this._factory.createIdentifier('upgrade'),
          /* typeArguments */ undefined,
          /* argumentsArray */ []
        )
      );
    }
  }
}

class UpgradeImportTransformer extends BaseTransformer {
  override visitSourceFile(node: ts.SourceFile) {
    if (this._context.needsUpgradeImport) {
      return this._factory.updateSourceFile(
        /* node */ node,
        /* statements */ [
          this._factory.createImportDeclaration(
            /* decorators */ undefined,
            /* modifiers */ undefined,
            /* importClauses */ this._factory.createImportClause(
              /* isTypeOnly */ false,
              /* name */ undefined,
              /* namedBindings */ this._factory.createNamedImports(
                /* elements */ [
                  this._factory.createImportSpecifier(
                    /* isTypeOnly */ false,
                    /* propertyName */ undefined,
                    /* name */ this._factory.createIdentifier('upgrade')
                  ),
                ]
              )
            ),
            /* moduleSpecifier */ this._factory.createStringLiteral(
              'lit/directives/upgrade.js'
            )
          ),
          ...node.statements,
        ],
        /* isDeclarationFile */ node.isDeclarationFile,
        /* referencedFiles */ node.referencedFiles,
        /* typeReferences */ node.typeReferenceDirectives,
        /* hasNoDefaultLib */ node.hasNoDefaultLib,
        /* libReferences */ node.libReferenceDirectives
      );
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

function addElementPart(node: Element, value: ts.Expression) {
  const attr: Attribute = {
    name: undefined as unknown as string,
    value: '',
  };
  node.attrs.push(attr);
  attr.litPart = {
    name: undefined,
    prefix: undefined,
    type: 6, // PartType.ELEMENT
    strings: ['', ''],
    values: [value],
    valueIndex: -1,
  };
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
            if (litPart.name) {
              addString(
                ` ${litPart.prefix ?? ''}${litPart.name}="${litPart.strings[0]}`
              );
              litPart.values.forEach((v, i) => {
                addPart(v);
                addString(litPart.strings[i + 1]!);
              });
              addString(`"`);
            } else {
              addString(' ');
              addPart(litPart.values[0]!);
            }
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
