import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.xmlConvertAll",
      () => {
        console.log("xml all command");
      },
    );
    return disposable;
  }
}
