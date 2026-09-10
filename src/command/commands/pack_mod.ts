import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand('bg3-toolkit.packMod', () => {
      console.log("packMod command");
    });
    return disposable;
  }
};

