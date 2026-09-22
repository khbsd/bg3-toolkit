import * as vscode from "vscode";
import { Lsx } from "../../utils/ls-formats/lsx";
import { getWorkspacePath } from "../../utils/ws";
import { CommandCommon } from "../command_common";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsxConvertAll",
      () => {
        console.log(getWorkspacePath());
        new Lsx(getWorkspacePath()).convertModDir();
      },
    );
    return disposable;
  }
}
