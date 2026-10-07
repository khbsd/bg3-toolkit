import * as fs from "fs";
import * as vscode from "vscode";
import { Registrar } from "./registrar/registrar";
import { getModPath } from "./utils/file";
import { getWorkspacePath, sleep } from "./utils/ws";
import { consoleWebviewLog, ConsoleWebviewViewProvider } from "./webview/console_webview";
import { ToolkitWebviewViewProvider } from "./webview/toolkit_webview";

// icon attribution:
// - square brackets ("[", "]"): https://github.com/tonsky/FiraCode, Fira Code OFL license
// - d20 vector: https://fontawesome.com/v5/icons/classic/solid/dice-d20 (c) CC BY 4.0 https://github.com/FortAwesome/Font-Awesome/blob/5.x/LICENSE.txt


export async function activate(context: vscode.ExtensionContext) {
  let isModWorkspace: boolean = false;
  try {
    const dirs = fs.readdirSync(getWorkspacePath(), { withFileTypes: true, recursive: true });

    for (const dir of dirs) {
      isModWorkspace = dir.name.toLowerCase() === "meta.lsx";
      if (isModWorkspace) {
        break;
      }
    }

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

  // toolkit webview
  const wvToolkit = new ToolkitWebviewViewProvider(
    context.extensionUri,
    isModWorkspace,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ToolkitWebviewViewProvider.viewType,
      wvToolkit,
    ),
  );

  if (isModWorkspace) {
    // console webview
    const csToolkit = new ConsoleWebviewViewProvider(
      context.extensionUri);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        ConsoleWebviewViewProvider.viewType,
        csToolkit,
      ),
    );
  }
}

export function deactivate() { }
