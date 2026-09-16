import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.locaConvertAll",
      () => {
        console.log("loca all command");
      },
    );
    return disposable;
  }
}
