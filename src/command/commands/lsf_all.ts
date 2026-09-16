import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsfConvertAll",
      () => {
        console.log("lsf all command");
      },
    );
    return disposable;
  }
}
