import * as vscode from "vscode";
import { Lsf } from "../../utils/ls-utils/lsx";
import { FileFormats } from "../../utils/ls-utils/formats";
import { getWorkspacePath } from "../../utils/ws_utils";
import { getModPath } from "../../utils/file_utils";

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
