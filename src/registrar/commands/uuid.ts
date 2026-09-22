import * as vscode from "vscode";
import { CommandCommon } from "../command_common";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.uuid",
      () => {
        console.log("yoo id");
      },
    );
    return disposable;
  }
}
