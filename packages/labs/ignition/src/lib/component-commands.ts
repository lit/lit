/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElementDeclaration} from '@lit-labs/analyzer';
import {createRequire} from 'module';
import * as path from 'node:path';
import {
  getAnalyzer,
  getDocumentUriForElement,
  getWorkspaceFolderForElement,
} from './analyzer.js';
import {logChannel} from './logging.js';
import {getStoriesModuleForElement} from './stories.js';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

export const createComponent = async () => {
  const workspaceFolder = await vscode.window.showWorkspaceFolderPick();

  if (workspaceFolder === undefined) {
    vscode.window.showErrorMessage(`No workspace folder`);
    return;
  }

  const componentName = await vscode.window.showInputBox({
    prompt: 'Component Name',
    placeHolder: '(placeholder)',
  });

  if (componentName === undefined) {
    vscode.window.showErrorMessage(`No component name`);
    return;
  }

  const fileNameBase = componentName.replaceAll(/\s+/g, '-').toLowerCase();
  const fileName = fileNameBase + '.ts';
  const storiesFileName = fileNameBase + '.stories.ts';

  const fileUri = workspaceFolder.uri.with({
    path: workspaceFolder.uri.path + '/src/' + fileName,
  });

  const storiesFileUri = workspaceFolder.uri.with({
    path: workspaceFolder.uri.path + '/src/' + storiesFileName,
  });

  await vscode.workspace.fs.writeFile(
    fileUri,
    new TextEncoder().encode(newComponentTemplate(componentName))
  );

  const jsFileName =
    fileName.substring(0, fileName.length - '.ts'.length) + '.js';
  await vscode.workspace.fs.writeFile(
    storiesFileUri,
    new TextEncoder().encode(newStoryTemplate(componentName, jsFileName))
  );

  // TODO: update the analyzer and UI that shows elements

  vscode.window.showInformationMessage(`Created component: ${componentName}`);
};

export const deleteComponent = async (data?: LitElementDeclaration) => {
  logChannel.appendLine(`deleteComponent: ${data?.name}`);

  if (data === undefined) {
    // TODO: ask for element?
    return;
  }

  const workspaceFolder = getWorkspaceFolderForElement(data);
  const analyzer = getAnalyzer(workspaceFolder);
  const fileUri = getDocumentUriForElement(data);
  const storiesModule = getStoriesModuleForElement(data, analyzer);
  const storiesPath = storiesModule?.sourcePath;
  const storiesFileUri =
    storiesPath === undefined
      ? undefined
      : workspaceFolder.uri.with({
          path: workspaceFolder.uri.path + '/' + storiesPath,
        });

  const storiesFileMessage =
    storiesFileUri === undefined ? '' : ` and ${storiesFileUri.fsPath}`;
  const answer = await vscode.window.showInformationMessage(
    `Delete ${fileUri.fsPath}${storiesFileMessage}`,
    'Delete',
    'Cancel'
  );
  if (answer === 'Delete') {
    await vscode.workspace.fs.delete(fileUri);
    if (storiesFileUri !== undefined) {
      await vscode.workspace.fs.delete(storiesFileUri);
    }
    // TODO: update analyzer and UI
  }
};

const newComponentTemplate = (componentName: string) => {
  const tagName = componentName.replaceAll(/\s+/g, '-').toLowerCase();
  const className = componentName.replaceAll(/\s+/g, '');
  return `import {html, css, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('${tagName}')
export class ${className} extends LitElement {
  static styles = css\`
    :host {
      display: block;
    }
  \`;

  render() {
    return html\`<h1>Hello from ${componentName}</h1>\`;
  }
}
`;
};

const newStoryTemplate = (componentName: string, jsFileName: string) => {
  const tagName = componentName.replaceAll(/\s+/g, '-').toLowerCase();
  const className = componentName.replaceAll(/\s+/g, '');
  return `import type {ComponentAnnotations, WebRenderer} from '@storybook/types';
import type {StoryObj} from '@storybook/web-components';

import {html, render} from 'lit';

import type {${className}} from './${jsFileName}';
import './${jsFileName}';

interface PlainWebRenderer extends WebRenderer {
  component: string;
  storyResult: void;
}

type Meta<T> = ComponentAnnotations<PlainWebRenderer, T>;

const meta: Meta<${className}> = {
  title: '${componentName}',
  component: 'element-two',
  render: (_args, {canvasElement}) => {
    render(html\`<${tagName}></${tagName}>\`, canvasElement);
  },
};
export default meta;
type Story = StoryObj<${className}> & {
  bounds?: {left: number; top: number; width: number; height: number};
};

export const storyOne: Story = {
  name: 'Element Two',
};
`;
};
