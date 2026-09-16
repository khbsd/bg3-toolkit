import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.locaConvert",
      () => {
        console.log("loca command");
      },
    );
    return disposable;
  }
}
