import * as vscode from "vscode";
import { Lsx } from "../../utils/ls-utils/lsx";
import { getWorkspacePath } from "../../utils/ws_utils";

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
