import * as vscode from "vscode";
import { getWorkspacePath } from "./utils/ws";
import { Registrar } from "./registrar/registrar";
import { WorkspaceTreeViewProvider } from "./treeview/treeview";
import { ToolkitWebviewViewProvider } from "./webview/webview";

// icon attribution:
// - square brackets ("[", "]"): https://github.com/tonsky/FiraCode, Fira Code OFL license
// - d20 vector: https://opensvg.dev/icons/action?prefix=fa-solid&icon=dice-d20, by dave gandy (c) CC BY 4.0

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
