import * as fs from "fs";
import * as vscode from "vscode";
import { Registrar } from "./registrar/registrar";
import { getModPath, hasMetaFile } from "./utils/file";
import { getWorkspacePath } from "./utils/ws";
import { ConsoleWebviewViewProvider } from "./webview/console_webview";
import { ToolkitWebviewViewProvider } from "./webview/toolkit_webview";

// icon attribution:
// - square brackets ("[", "]"): https://github.com/tonsky/FiraCode, Fira Code OFL license
// - d20 vector: https://fontawesome.com/v5/icons/classic/solid/dice-d20 (c) CC BY 4.0 https://github.com/FortAwesome/Font-Awesome/blob/5.x/LICENSE.txt

export async function activate(context: vscode.ExtensionContext) {
  let isModWorkspace: boolean = false;
  try {
    const dirs = fs.readdirSync(getWorkspacePath(), { withFileTypes: true, recursive: true, });
    for (const dir of dirs) {
      isModWorkspace = hasMetaFile(dir.name);
      if (isModWorkspace) {
        // mostly here to double check that it wont error out
        console.log(getModPath(dir.parentPath));
        break;
      }
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
  /**
   * "Error: ENOENT: no such file or directory, scandir '/Users/kaya/Games/bg3_data/Data/unpacked'\n\tat read (node:electron/js2c/node_init:2:15815)\n\tat readdirSyncRecursive (node:electron/js2c/node_init:2:15980)\n\tat Object.<anonymous> (node:electron/js2c/node_init:2:16026)\n\tat activate (/Users/kaya/Programming/bg3-toolkit/out/extension.js:53:25)\n\tat ME._callActivateOptional (file:///Applications/VSCodium.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:144:19332)\n\tat ME._ca…vs/workbench/api/node/extensionHostProcess.js:144:16950\n\tat async XC._activate (file:///Applications/VSCodium.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:140:16342)\n\tat async XC._waitForDepsThenActivate (file:///Applications/VSCodium.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:140:16284)\n\tat async XC._initialize (file:///Applications/VSCodium.app/Contents/Resources/app/out/vs/workbench/api/node/extensionHostProcess.js:140:15647)"

   */

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
