import * as vscode from 'vscode';
import * as path from 'path';
import { Registrar } from './command/registrar';
import { WorkspaceTreeViewProvider } from './treeview/treeview';
import { ToolkitWebviewViewProvider } from './webview/webview';

export async function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('yo bitches im fuckin back lmao');

	// register commands
	// this needs to go first, since the commands are used in the tree view
	let r = new Registrar();
	for (let disposable of r.getCommandList()) {
		context.subscriptions.push(disposable);
	}

	// set up wsPath
	let wsPath: string;

	if (vscode.workspace.workspaceFolders?.length !== undefined
		&& vscode.workspace.workspaceFolders.length > 0)
	{
		wsPath = vscode.workspace.workspaceFolders[0].uri.toString();
	} else {
		wsPath = "home";
	}

	let wsPathShortSlice = wsPath.split(path.sep).slice(-1);
	let wsPathShort: string = "";
	wsPathShortSlice.forEach((p) => wsPathShort = wsPathShort.concat(p, path.sep, ""));

	// treeview
	let tvWorkspace = vscode.window.createTreeView('toolkitTreeWorkspace', {
  		treeDataProvider: new WorkspaceTreeViewProvider(wsPath),
	});

	// webview
	let wvToolkit = new ToolkitWebviewViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ToolkitWebviewViewProvider.viewType, wvToolkit)
	);

	tvWorkspace.message = "\nyour workspace is:" + ".../" + wsPathShort;
	
}

export function deactivate() { }
