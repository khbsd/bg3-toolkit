import * as vscode from "vscode";
import { Registrar } from "./registrar/registrar";
import { getModPath } from "./utils/file";
import { getWorkspacePath } from "./utils/ws";
import { ToolkitWebviewViewProvider } from "./webview/toolkit_webview";

// icon attribution:
// - square brackets ("[", "]"): https://github.com/tonsky/FiraCode, Fira Code OFL license
// - d20 vector: https://fontawesome.com/v5/icons/classic/solid/dice-d20 (c) CC BY 4.0 https://github.com/FortAwesome/Font-Awesome/blob/5.x/LICENSE.txt

// TODO:
// - webview console

export async function activate(context: vscode.ExtensionContext) {
  let isModWorkspace: boolean = true;
  try {
    getModPath(getWorkspacePath());
  } catch (err) {
    isModWorkspace = false;
  }
  vscode.commands.executeCommand(
    "setContext",
    "bg3-toolkit.isModWorkspace",
    isModWorkspace,
  );

  // register commands
  for (let disposable of new Registrar().getCommandList()) {
    context.subscriptions.push(disposable);
  }

  // webview
  let wvToolkit = new ToolkitWebviewViewProvider(
    context.extensionUri,
    isModWorkspace,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ToolkitWebviewViewProvider.viewType,
      wvToolkit,
    ),
  );
}

export function deactivate() { }
