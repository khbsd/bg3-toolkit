import * as vscode from 'vscode';
import * as path from 'path';
import { Registrar } from './command/registrar';
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
	let wsPath: string;

	if (vscode.workspace.workspaceFolders?.length !== undefined && vscode.workspace.workspaceFolders.length > 0) {
		wsPath = vscode.workspace.workspaceFolders[0].uri.toString();
	} else {
		wsPath = "home";
	}
	let tvWelcome = vscode.window.createTreeView('toolkitTree', {
  		treeDataProvider: new ToolkitTreeProvider(wsPath),
	});
	let tvWorkspace = vscode.window.createTreeView('toolkitTreeWorkspace', {
  		treeDataProvider: new ToolkitTreeProvider(wsPath),
	});

	let wsPathShort = wsPath.split(path.sep).slice(-4);
	console.log(wsPathShort);
	tvWorkspace.message = "\nyour workspace is:\n\n" + wsPathShort.forEach((p) => {console.log(p);return path.join(p, path.sep);});
	
}

export function deactivate() { }
