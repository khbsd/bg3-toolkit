import * as vscode from "vscode";
import { CommandCommon } from "../command_common";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.handle",
      () => {
        console.log("hindle");
      },
    );
    return disposable;
  }
}
