import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsxConvertAll",
      () => {
        console.log("lsx all command");
      },
    );
    return disposable;
  }
}
