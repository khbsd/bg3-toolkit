import * as vscode from "vscode";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand('bg3-toolkit.hrtRemind', () => {
      vscode.window.showInformationMessage('take ya hrt weirdo');
      console.log("hi");
    });
    return disposable;
  }
};

