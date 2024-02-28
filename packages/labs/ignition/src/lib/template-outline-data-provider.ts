/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  ClassMethod,
  LitElementDeclaration,
} from '@lit-labs/analyzer/lib/model.js';
import {createRequire} from 'node:module';
import {getAnalyzer, getWorkspaceFolderForElement} from './analyzer.js';
import {logChannel} from './logging.js';

import type ts from 'typescript';
import {Analyzer} from '@lit-labs/analyzer';
import type {Ignition} from './ignition.js';
import {
  LitTemplate,
  LitTemplateNode,
  getChildPartExpression,
  hasChildPart,
  isCommentNode,
  isDocumentFragment,
  isElementNode,
  isLitTaggedTemplateExpression,
  parseLitTemplate,
} from './parse-template.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

export class TemplateOutlineDataProvider
  implements vscode.TreeDataProvider<TemplateItem>
{
  ignition: Ignition;

  constructor(ignition: Ignition) {
    this.ignition = ignition;
    ignition.onDidChangeCurrentElement(() => {
      logChannel.appendLine('onDidChangeCurrentElement');
      this.#onDidChangeTreeData.fire();
    });
  }

  #onDidChangeTreeData: vscode.EventEmitter<
    TemplateItem<TemplateNode> | undefined | void
  > = new vscode.EventEmitter<TemplateItem<TemplateNode> | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TemplateItem<TemplateNode> | undefined | void
  > = this.#onDidChangeTreeData.event;

  getTreeItem(data: TemplateItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    if (data.node instanceof LitElementDeclaration) {
      const element = data.node;
      const label =
        element.tagname === undefined
          ? element.name
          : `<${data.node.tagname}> (Host)`;
      return new vscode.TreeItem(
        label,
        vscode.TreeItemCollapsibleState.Expanded
      );
    } else if (data.node instanceof ClassMethod) {
      return new vscode.TreeItem(
        data.node.name + '()',
        vscode.TreeItemCollapsibleState.Expanded
      );
    } else if (data.node instanceof Binding) {
      return new vscode.TreeItem(
        `\${${data.node.type}}`,
        vscode.TreeItemCollapsibleState.Expanded
      );
    } else if (data.node instanceof Expression) {
      return new vscode.TreeItem(
        `(Expression)`,
        vscode.TreeItemCollapsibleState.None
      );
    } else if (isDocumentFragment(data.node)) {
      return new vscode.TreeItem(
        `html\`\``,
        vscode.TreeItemCollapsibleState.Expanded
      );
    } else if (isElementNode(data.node)) {
      const label = `<${data.node.tagName}>`;
      const collapsedState =
        data.node.childNodes.length > 0
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.None;
      const treeItem = new vscode.TreeItem(label, collapsedState);
      return treeItem;
    } else {
      return new vscode.TreeItem(
        data.node.nodeName,
        vscode.TreeItemCollapsibleState.None
      );
    }
  }

  async getChildren(
    data?: TemplateItem | undefined
  ): Promise<TemplateItem[] | undefined> {
    if (data === undefined) {
      const element = this.ignition.currentElement;
      if (element === undefined) {
        return undefined;
      }
      const workspaceFolder = getWorkspaceFolderForElement(element);
      const analyzer = getAnalyzer(workspaceFolder);
      return [{node: element, analyzer}];
    } else if (data.node instanceof LitElementDeclaration) {
      // We want to return the render() method, and ideally, any other methods
      // that return templates and are called in the render method.
      // TODO: The structure we support here should be captured in a reusable
      // analysis and linting library. This is the Ignition file format.
      const {node, analyzer} = data;
      const renderMethod = [...node.methods].find((m) => m.name === 'render');
      return renderMethod === undefined
        ? undefined
        : [{node: renderMethod, analyzer}];
    } else if (data.node instanceof ClassMethod) {
      const {node, analyzer} = data;
      logChannel.appendLine(`getChildren ClassMethod: ${node.name}`);
      const ts = analyzer.typescript;
      const tsNode = node.node;
      const lastStatement =
        tsNode.body?.statements[tsNode.body?.statements.length - 1];
      if (lastStatement === undefined) {
        logChannel.appendLine('lastStatement is undefined');
        return undefined;
      }
      // The last statement of the render method should be a return statement
      // that returns a template literal.
      if (ts.isReturnStatement(lastStatement)) {
        const returnExpression = lastStatement.expression;
        const checker = analyzer.program.getTypeChecker();
        if (
          returnExpression === undefined ||
          !isLitTaggedTemplateExpression(returnExpression, ts, checker)
        ) {
          logChannel.appendLine(
            `returnExpression is not a Lit template literal ${returnExpression?.getFullText()}`
          );
          return undefined;
        }
        const template = parseLitTemplate(returnExpression, ts, checker);
        return [{node: template, analyzer}];
      }
      logChannel.appendLine('lastStatement is not a return statement');
      return undefined;
    } else if (data.node instanceof Binding) {
      const {type} = data.node;
      if (type === 'ternary') {
        const {node, analyzer} = data;
        const ts = analyzer.typescript;
        const checker = analyzer.program.getTypeChecker();
        const expression = data.node.tsNode as ts.ConditionalExpression;

        let trueChild, falseChild;

        if (isLitTaggedTemplateExpression(expression.whenTrue, ts, checker)) {
          const template = parseLitTemplate(expression.whenTrue, ts, checker);
          trueChild = {node: template, analyzer};
        } else {
          trueChild = {
            node: new Expression(expression.whenTrue),
            analyzer: data.analyzer,
          };
        }

        if (isLitTaggedTemplateExpression(expression.whenFalse, ts, checker)) {
          const template = parseLitTemplate(expression.whenFalse, ts, checker);
          falseChild = {node: template, analyzer};
        } else {
          falseChild = {
            node: new Expression(expression.whenFalse),
            analyzer: data.analyzer,
          };
        }

        return [trueChild, falseChild];
      }
    } else if (data.node instanceof Expression) {
      const {node, analyzer} = data;
      const ts = analyzer.typescript;
      const checker = analyzer.program.getTypeChecker();
      if (isLitTaggedTemplateExpression(node.tsNode, ts, checker)) {
        const template = parseLitTemplate(node.tsNode, ts, checker);
        return [{node: template, analyzer}];
      }
      return [];
    } else if (isDocumentFragment(data.node) || isElementNode(data.node)) {
      // TODO: better types in the template parser
      return data.node.childNodes.map((node) => {
        if (isCommentNode(node) && hasChildPart(node)) {
          // Handle child parts
          const ts = data.analyzer.typescript;
          const expression = getChildPartExpression(node, ts);
          if (expression === undefined) {
            throw new Error('inconceivable!');
          }
          if (ts.isConditionalExpression(expression)) {
            return {
              node: new Binding('ternary', expression),
              analyzer: data.analyzer,
            };
          }
        }
        return {node, analyzer: data.analyzer} as TemplateItem;
      });
    }
  }
}

type TemplateNode =
  | LitElementDeclaration
  | ClassMethod
  | LitTemplate
  | LitTemplateNode
  | Binding
  | Expression;

type BindingType = 'ternary' | 'unknown';

class Expression {
  readonly tsNode: ts.Expression;

  constructor(tsNode: ts.Expression) {
    this.tsNode = tsNode;
  }
}

/**
 * The main difference between a binding and an expression is that we want to
 * present the binding with a specific treatment in the tree (${...})
 */
class Binding extends Expression {
  readonly type: BindingType;

  constructor(type: BindingType, tsNode: ts.Expression) {
    super(tsNode);
    this.type = type;
  }
}

interface TemplateItem<T extends TemplateNode = TemplateNode> {
  node: T;
  analyzer: Analyzer;
}
