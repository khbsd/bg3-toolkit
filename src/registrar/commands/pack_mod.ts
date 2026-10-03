import * as vscode from "vscode";
import { pack } from "../../utils/ls-formats/junction";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.packMod",
      () => {
        pack();
      },
    );
    return disposable;
  }
}
