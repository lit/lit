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
import ts from 'typescript';
import {Analyzer} from '@lit-labs/analyzer';
import type {Ignition} from './ignition.js';
import {
  LitTemplate,
  LitTemplateNode,
  getChildPartExpression,
  getSourceIdForElement,
  hasChildPart,
  isCommentNode,
  isDocumentFragment,
  isElementNode,
  isLitTaggedTemplateExpression,
  isLitTemplate,
  isNode,
  isTextNode,
  parseLitTemplate,
} from './parse-template.js';
import * as path from 'node:path';

const require = createRequire(import.meta.url);
import vscode = require('vscode');
import type {
  ProjectServerSourceUrl,
  TemplatePiece,
} from '../../../ignition-ui/unbundled/lib/protocol/common.js';
import {getProjectServerIfRunning} from './project-server.js';

export class TemplateOutlineDataProvider
  implements vscode.TreeDataProvider<TemplateItem>
{
  readonly ignition: Ignition;

  constructor(ignition: Ignition) {
    this.ignition = ignition;
    ignition.onDidChangeCurrentElement(() => {
      logChannel.appendLine('onDidChangeCurrentElement');
      this.#onDidChangeTreeData.fire();
    });
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ignition.showInvisibles')) {
        this.#onDidChangeTreeData.fire();
      }
    });
  }

  #onDidChangeTreeData: vscode.EventEmitter<
    TemplateItem<TemplateNode> | undefined | void
  > = new vscode.EventEmitter<TemplateItem<TemplateNode> | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TemplateItem<TemplateNode> | undefined | void
  > = this.#onDidChangeTreeData.event;

  async getTreeItem(data: TemplateItem): Promise<vscode.TreeItem> {
    const treeItem = this.#getTreeItem(data);
    const location = getLocationForItem(data);
    if (location !== undefined) {
      const templatePiece = await getTemplatePieceForItem(data, location);
      treeItem.command = {
        title: 'Highlight Source Code',
        command: 'ignition.highlightSourceCode',
        arguments: [location, templatePiece],
      };
    }
    return treeItem;
  }

  #getTreeItem(data: TemplateItem): vscode.TreeItem {
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
    } else if (isTextNode(data.node)) {
      const showInvisibles = vscode.workspace
        .getConfiguration('ignition')
        .get('showInvisibles');
      let contents = data.node.value;
      if (!showInvisibles) {
        contents = contents.replace(/\s+/g, ' ');
      }
      if (contents.length > 200) {
        contents = contents.slice(0, 199) + '…';
      }
      return new vscode.TreeItem(
        JSON.stringify(contents),
        vscode.TreeItemCollapsibleState.None
      );
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
    let children = await this.#getChildren(data);
    if (children === undefined) {
      return undefined;
    }
    const showInvisibles = vscode.workspace
      .getConfiguration('ignition')
      .get('showInvisibles');
    if (!showInvisibles) {
      children = children.filter((c) => {
        if (!isNode(c.node)) {
          return true;
        }
        if (!isTextNode(c.node)) {
          return true;
        }
        return c.node.value.trim() !== '';
      });
    }
    return children;
  }

  async #getChildren(
    data?: TemplateItem | undefined
  ): Promise<TemplateItem[] | undefined> {
    if (data === undefined) {
      const element = this.ignition.currentElement;
      if (element === undefined) {
        return undefined;
      }
      const workspaceFolder = getWorkspaceFolderForElement(element);
      const analyzer = getAnalyzer(workspaceFolder, this.ignition.filesystem);
      return [{node: element, analyzer, parent: data}];
    } else if (data.node instanceof LitElementDeclaration) {
      // We want to return the render() method, and ideally, any other methods
      // that return templates and are called in the render method.
      // TODO: The structure we support here should be captured in a reusable
      // analysis and linting library. This is the Ignition file format.
      const {node, analyzer} = data;
      const renderMethod = [...node.methods].find((m) => m.name === 'render');
      return renderMethod === undefined
        ? undefined
        : [{node: renderMethod, analyzer, parent: data}];
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
        return [{node: template, analyzer, parent: data}];
      }
      logChannel.appendLine('lastStatement is not a return statement');
      return undefined;
    } else if (data.node instanceof Binding) {
      const {type} = data.node;
      if (type === 'ternary') {
        const {analyzer} = data;
        const ts = analyzer.typescript;
        const checker = analyzer.program.getTypeChecker();
        const expression = data.node.tsNode as ts.ConditionalExpression;

        let trueChild, falseChild;

        if (isLitTaggedTemplateExpression(expression.whenTrue, ts, checker)) {
          const template = parseLitTemplate(expression.whenTrue, ts, checker);
          trueChild = {node: template, analyzer, parent: data};
        } else {
          trueChild = {
            node: new Expression(expression.whenTrue),
            analyzer: data.analyzer,
            parent: data,
          };
        }

        if (isLitTaggedTemplateExpression(expression.whenFalse, ts, checker)) {
          const template = parseLitTemplate(expression.whenFalse, ts, checker);
          falseChild = {node: template, analyzer, parent: data};
        } else {
          falseChild = {
            node: new Expression(expression.whenFalse),
            analyzer: data.analyzer,
            parent: data,
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
        return [{node: template, analyzer, parent: data}];
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
              parent: data,
            };
          }
        }
        return {
          node: node as TemplateNode,
          analyzer: data.analyzer,
          parent: data,
        };
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
  parent: TemplateItem | undefined;
}

function getLocationForItem(item: TemplateItem): undefined | vscode.Location {
  if (
    item.node instanceof LitElementDeclaration ||
    item.node instanceof ClassMethod
  ) {
    return locationForTsNode(item.node.node);
  }
  if (isLitTemplate(item.node) || item.node instanceof Expression) {
    return locationForTsNode(item.node.tsNode);
  }
  const locationInTemplate = item.node.sourceCodeLocation;
  if (locationInTemplate == null) {
    return undefined;
  }
  let containingTemplate: LitTemplate | undefined;
  let curr = item.parent;
  while (curr !== undefined) {
    if (isLitTemplate(curr.node)) {
      containingTemplate = curr.node;
      break;
    }
    curr = curr.parent;
  }
  if (containingTemplate === undefined) {
    return;
  }
  const template = containingTemplate.tsNode.template;
  const start = getOffsetInTemplate(
    template,
    locationInTemplate.startOffset + 1
  );
  const end = getOffsetInTemplate(template, locationInTemplate.endOffset + 1);

  const sourceFile: ts.SourceFile = containingTemplate.tsNode.getSourceFile();
  const uri = vscode.Uri.file(sourceFile.fileName);
  const tsPositionStart = sourceFile.getLineAndCharacterOfPosition(start);
  const tsPositionEnd = sourceFile.getLineAndCharacterOfPosition(end);
  return new vscode.Location(
    uri,
    new vscode.Range(
      new vscode.Position(tsPositionStart.line, tsPositionStart.character),
      new vscode.Position(tsPositionEnd.line, tsPositionEnd.character)
    )
  );
}

function locationForTsNode(node: ts.Node): vscode.Location {
  const sourceFile = node.getSourceFile();
  const start = node.getStart();
  const end = node.getEnd();
  const uri = vscode.Uri.file(sourceFile.fileName);
  const tsPositionStart = sourceFile.getLineAndCharacterOfPosition(start);
  const tsPositionEnd = sourceFile.getLineAndCharacterOfPosition(end);
  return new vscode.Location(
    uri,
    new vscode.Range(
      new vscode.Position(tsPositionStart.line, tsPositionStart.character),
      new vscode.Position(tsPositionEnd.line, tsPositionEnd.character)
    )
  );
}

/**
 * We've got a location in a template literal as its contents were
 * parsed, ignoring its expressions. We want to get the location in the
 * original source file.
 *
 * Things this may not yet account for:
 *     - escapes that have a different length in the original source than the
 *       actual value.
 *     - inserted Lit binding content that isn't in the original source.
 *       i.e. the comments and modifications to attributes that are inserted
 *       as part of parseLitTemplate
 */
function getOffsetInTemplate(
  template: ts.TemplateLiteral,
  offsetInsideLiteral: number
): number {
  let offset = offsetInsideLiteral + template.getStart();
  if (ts.isNoSubstitutionTemplateLiteral(template)) {
    // The easy case!
    return offset;
  }
  const head = template.head;
  if (offset < head.end) {
    // we're done
    return offset;
  }
  let prevEnd = head.end;
  for (const span of template.templateSpans) {
    // The length of the ${...}. The +1 is because the TemplateMiddle /
    // TemplateTail includes the closing }
    const expressionLength = span.literal.getStart() + 1 - prevEnd;
    offset += expressionLength;
    if (offset < span.literal.end) {
      return offset;
    }
    prevEnd = span.literal.end;
  }
  return offset;
}

async function getTemplatePieceForItem(
  data: TemplateItem<TemplateNode>,
  location: vscode.Location
): Promise<TemplatePiece | undefined> {
  if (isNode(data.node) && isElementNode(data.node)) {
    const url = await getServedUrlForFile(location.uri);
    if (url === undefined) {
      return;
    }
    // Missing piece: looking up the source ID for the element.
    let template: LitTemplate | undefined;
    let curr = data.parent;
    while (curr !== undefined) {
      if (isLitTemplate(curr.node)) {
        template = curr.node;
        break;
      }
      curr = curr.parent;
    }
    if (template === undefined) {
      return;
    }

    const sourceId = getSourceIdForElement(
      template.tsNode.getSourceFile(),
      data.node,
      data.analyzer.typescript,
      data.analyzer.program.getTypeChecker()
    );
    if (sourceId === undefined) {
      return;
    }

    const templatePiece = {
      kind: 'element',
      url,
      sourceId: String(sourceId),
    } as const;
    return templatePiece;
  }
  return;
}

async function getServedUrlForFile(
  uri: vscode.Uri
): Promise<ProjectServerSourceUrl | undefined> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (workspaceFolder === undefined) {
    return;
  }
  const projectServer = await getProjectServerIfRunning(workspaceFolder);
  if (projectServer === undefined) {
    return;
  }
  const address = projectServer.address();
  if (address === null) {
    throw new Error('Project server had no address?');
  }
  if (typeof address === 'string') {
    throw new Error('Project server address was a string?');
  }
  const port = address.port;
  const url = new URL(`http://localhost:${port}`);
  url.pathname = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
  return url.href as ProjectServerSourceUrl;
}
