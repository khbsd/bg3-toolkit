import * as vscode from "vscode";
import { Registrar } from "./registrar/registrar";
import { getModPath } from "./utils/file";
import { getWorkspacePath } from "./utils/ws";
import { ToolkitWebviewViewProvider } from "./webview/webview";

// icon attribution:
// - square brackets ("[", "]"): https://github.com/tonsky/FiraCode, Fira Code OFL license
// - d20 vector: https://opensvg.dev/icons/action?prefix=fa-solid&icon=dice-d20, by dave gandy (c) CC BY 4.0

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

export function deactivate() {}
