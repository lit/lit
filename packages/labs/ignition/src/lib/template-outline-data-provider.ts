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

import {Analyzer} from '@lit-labs/analyzer';
import type {Ignition} from './ignition.js';
import {
  LitTemplate,
  LitTemplateNode,
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
    } else if (isDocumentFragment(data.node)) {
      return new vscode.TreeItem(
        `(Lit Template)`,
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
    } else if (isCommentNode(data.node) && hasChildPart(data.node)) {
      return new vscode.TreeItem(
        `(Child Part Binding)`,
        vscode.TreeItemCollapsibleState.None
      );
    } else {
      return new vscode.TreeItem(
        `(${data.node.nodeName})`,
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
      // analysis and linting libirary. This is the Ignition file format.
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
    } else if (isDocumentFragment(data.node) || isElementNode(data.node)) {
      // TODO: better types in the template parser
      return data.node.childNodes.map(
        (node) => ({node, analyzer: data.analyzer}) as TemplateItem
      );
    } else {
      // TODO: handle child parts
    }
  }
}

type TemplateNode =
  | LitElementDeclaration
  | ClassMethod
  | LitTemplate
  | LitTemplateNode;

interface TemplateItem<T extends TemplateNode = TemplateNode> {
  node: T;
  analyzer: Analyzer;
}
