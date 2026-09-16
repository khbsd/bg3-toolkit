import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsfConvert",
      () => {
        console.log("lsf command");
      },
    );
    return disposable;
  }
}
