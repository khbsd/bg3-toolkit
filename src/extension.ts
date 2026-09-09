import * as vscode from "vscode";
import * as path from "path";
import { getWorkspacePath } from "./utils/utils";
import { Registrar } from "./command/registrar";
import { WorkspaceTreeViewProvider } from "./treeview/treeview";
import { ToolkitWebviewViewProvider } from "./webview/webview";

export async function activate(context: vscode.ExtensionContext) {
  // register commands
  // this needs to go first, since the commands are used in the tree view
  for (let disposable of new Registrar().getCommandList()) {
    context.subscriptions.push(disposable);
  }

  // treeview
  let tvWorkspace = vscode.window.createTreeView("toolkitTreeWorkspace", {
    treeDataProvider: new WorkspaceTreeViewProvider(getWorkspacePath()),
  });

  // webview
  let wvToolkit = new ToolkitWebviewViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ToolkitWebviewViewProvider.viewType,
      wvToolkit,
    ),
  );

  tvWorkspace.message =
    "\nyour workspace is:" + ".../" + getWorkspacePath(true);
}

export function deactivate() {}
