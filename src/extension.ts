import * as vscode from 'vscode';
import { Registrar } from './command/register';
import { ToolkitTreeProvider } from './treeview/treeview';

export async function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('yo bitches im fuckin back lmao');

	// register commands
	// this needs to go first, since the commands are used in the tree view
	let r = new Registrar();
	for (let disposable of r.getCommandList()) {
		context.subscriptions.push(disposable);
	}

	// set up treeview
	let wsPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
	vscode.window.registerTreeDataProvider(
  	'toolkitTree',
  	new ToolkitTreeProvider(wsPath)
	);
	vscode.window.createTreeView('toolkitTree', {
  		treeDataProvider: new ToolkitTreeProvider(wsPath),
	});
	
}

export function deactivate() { }
