/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

export class ElementsDataProvider
  implements vscode.TreeDataProvider<ElementTreeItem>
{
  constructor() {}
  onDidChangeTreeData?:
    | vscode.Event<
        void | ElementTreeItem | ElementTreeItem[] | null | undefined
      >
    | undefined;

  getTreeItem(
    element: ElementTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: ElementTreeItem | undefined
  ): vscode.ProviderResult<ElementTreeItem[]> {
    if (element === undefined) {
      return [rootItem];
    } else if (element === rootItem) {
      return [
        new ElementTreeItem('child', vscode.TreeItemCollapsibleState.None),
      ];
    }
  }
}

// So far in this stub the element type is itself a TreeItem, but we actually
// want the element type to be an Analyzer CustomElementDeclaration.
export class ElementTreeItem extends vscode.TreeItem {}

const rootItem = new ElementTreeItem(
  'root',
  vscode.TreeItemCollapsibleState.Expanded
);
