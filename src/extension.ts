import * as fs from "fs";
import * as vscode from "vscode";

import { Registrar } from "./registrar/registrar";
import { getModPath, hasMetaFile } from "./utils/file";
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

    console.log("what");
    const dirs = fs.readdirSync(getWorkspacePath(), {
      withFileTypes: true,
      recursive: true,
    });
    console.log(isModWorkspace);
    for (const dir of dirs) {
      isModWorkspace = hasMetaFile(dir.name);
      if (isModWorkspace) {
        // mostly here to double check that it wont error out
        console.log((wsPath = getModPath(dir.parentPath)));
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

  console.log("set bg3-toolkit.isModWorkspace to:", isModWorkspace);

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
    console.log("dont load this");
    // console webview
    const csToolkit = new ConsoleWebviewViewProvider(context.extensionUri);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        ConsoleWebviewViewProvider.viewType,
        csToolkit,
      ),
    );

    // register commands
    for (let disposable of new Registrar().getCommandList()) {
      context.subscriptions.push(disposable);
    }
  }
}

export function deactivate() {}
