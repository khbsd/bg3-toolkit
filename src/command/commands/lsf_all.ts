import * as vscode from "vscode";
import { Lsf } from "../../utils/ls-formats/lsx";
import { getWorkspacePath } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsfConvertAll",
      () => {
        console.log(getWorkspacePath());
        new Lsf(getWorkspacePath()).convertModDir();
      },
    );
    return disposable;
  }
}
