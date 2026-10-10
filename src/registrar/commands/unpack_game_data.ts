import * as vscode from "vscode";
import { unpackGameData } from "../../utils/ls-formats/junction";

// TODO: refactor this, probably to junction.ts
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



