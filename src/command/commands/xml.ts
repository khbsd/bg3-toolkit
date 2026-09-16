import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.xmlConvert",
      () => {
        console.log("xml command");
      },
    );
    return disposable;
  }
}
