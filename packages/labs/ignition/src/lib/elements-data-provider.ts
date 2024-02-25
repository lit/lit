/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {LitElementDeclaration} from '@lit-labs/analyzer';
import {createRequire} from 'node:module';
import {getAnalyzer} from './analyzer.js';
import {logChannel} from './logging.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

export class ElementsDataProvider
  implements vscode.TreeDataProvider<ElementsPanelItem>
{
  onDidChangeTreeData?:
    | vscode.Event<
        void | ElementsPanelItem | ElementsPanelItem[] | null | undefined
      >
    | undefined;

  getTreeItem(
    data: ElementsPanelItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    if (data instanceof WorkspaceItem) {
      return new vscode.TreeItem(
        `${data.folder.name} (Workspace)`,
        vscode.TreeItemCollapsibleState.Expanded
      );
    } else {
      const label =
        data.tagname === undefined ? data.name : `<${data.tagname}>`;
      const treeItem = new vscode.TreeItem(
        label,
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.command = {
        title: 'Open Element',
        command: 'ignition.openElement',
        arguments: [data],
      };
      return treeItem;
    }
  }

  async getChildren(
    data?: ElementsPanelItem | undefined
  ): Promise<ElementsPanelItem[] | undefined> {
    if (vscode.workspace.workspaceFolders === undefined) {
      return undefined;
    }

    if (data === undefined) {
      return vscode.workspace.workspaceFolders.map(
        (folder) => new WorkspaceItem(folder)
      );
    } else if (data instanceof WorkspaceItem) {
      const analyzer = await getAnalyzer(data.folder);
      // const modules = analyzer.
      const pkg = analyzer.getPackage();
      const litModules = pkg.getLitElementModules();
      logChannel.appendLine(
        `litModules: ${litModules.map((m) => m.module.sourcePath)}`
      );
      const litElementDeclarationss = litModules.flatMap((m) => m.declarations);
      return litElementDeclarationss;
    }
  }
}

type ElementsPanelItem = WorkspaceItem | LitElementDeclaration;

class WorkspaceItem {
  folder: vscode.WorkspaceFolder;

  constructor(folder: vscode.WorkspaceFolder) {
    this.folder = folder;
  }
}
