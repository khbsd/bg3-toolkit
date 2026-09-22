import * as vscode from "vscode";
import { pack } from "../junction";
import { getWorkspacePath } from "../../utils/ws";
import { CommandCommon } from "../command_common";

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
