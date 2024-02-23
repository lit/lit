/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {createRequire} from 'node:module';
import {getWorkspaceResources} from './servers.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');
import {LitElementDeclaration} from '@lit-labs/analyzer';
import {logChannel} from './logging.js';

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
        vscode.TreeItemCollapsibleState.Collapsed
      );
    } else {
      const label =
        data.tagname === undefined ? data.name : `<${data.tagname}>`;
      return new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
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
      const {analyzer} = await getWorkspaceResources(data.folder);
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

// So far in this stub the element type is itself a TreeItem, but we actually
// want the element type to be an Analyzer CustomElementDeclaration.
export class ElementTreeItem extends vscode.TreeItem {}

const rootItem = new ElementTreeItem(
  'root',
  vscode.TreeItemCollapsibleState.Expanded
);
