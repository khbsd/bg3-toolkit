import * as vscode from "vscode";
import { unpackGameData } from "../../utils/ls-formats/junction";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.unpackGameData",
      async () => {
        unpackGameData();
      }
    );
    return disposable;
  }
}
