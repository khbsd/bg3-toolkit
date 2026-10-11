import * as vscode from "vscode";

import { consoleWebviewLog } from "../../webview/console_webview";


export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.hrtRemind",
      () => {
        vscode.window.showInformationMessage("take ya hrt weirdo");
        consoleWebviewLog("hi");
      },
    );
    return disposable;
  }
}
