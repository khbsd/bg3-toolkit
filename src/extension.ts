import * as fs from "fs";
import * as vscode from "vscode";

import { Registrar } from "./registrar/registrar";
import { getModPath } from "./utils/file";
import { hasMetaFile } from "./utils/mod_info";
import { getWorkspacePath } from "./utils/ws";
import { ConsoleWebviewViewProvider } from "./webview/console";
import { ToolkitWebviewViewProvider } from "./webview/toolkit";

// icon attribution:
// - square brackets ("[", "]"): https://github.com/tonsky/FiraCode, Fira Code OFL license
// - d20 vector: https://fontawesome.com/v5/icons/classic/solid/dice-d20 (c) CC BY 4.0 https://github.com/FortAwesome/Font-Awesome/blob/5.x/LICENSE.txt

export async function activate(context: vscode.ExtensionContext) {
  let isModWorkspace: boolean = false;
  try {
    let wsPath: string = "";

    const dirs = fs.readdirSync(getWorkspacePath(), {
      withFileTypes: true,
      recursive: true,
    });

    for (const dir of dirs) {
      isModWorkspace = hasMetaFile(dir.name);
      if (isModWorkspace) {
        // mostly here to double check that it wont error out
        wsPath = getModPath(dir.parentPath);
        console.log(wsPath);
        break;
      }
    }

    if (wsPath.length === 0) {
      throw Error("no workspace or work folder detected");
    }
  } catch (err) {
    console.log(err);
    isModWorkspace = false;
  }

  vscode.commands.executeCommand(
    "setContext",
    "bg3-toolkit.isModWorkspace",
    isModWorkspace,
  );

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

  // console webview
  const wvConsole = new ConsoleWebviewViewProvider(
    context.extensionUri,
    isModWorkspace,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ConsoleWebviewViewProvider.viewType,
      wvConsole,
    ),
  );

  if (isModWorkspace) {
    // register commands
    for (let disposable of new Registrar().getCommandList()) {
      context.subscriptions.push(disposable);
    }
  } else {
    let makeModCmd = require("./registrar/commands/make_mod_template");
    context.subscriptions.push(new makeModCmd.Command().get());
  }
}

export function deactivate() {}
