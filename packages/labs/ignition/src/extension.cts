import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  // eslint-disable-next-line
  const {LitModuleEditorProvider} = await import('./lib/lit-module-editor.js');
  context.subscriptions.push(LitModuleEditorProvider.register(context));

  let disposable = vscode.commands.registerCommand('ignition.hello', () => {
    vscode.window.showInformationMessage('Hello from Ignition!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
