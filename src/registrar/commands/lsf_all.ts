import * as vscode from "vscode";
import { Lsf } from "../../utils/ls-formats/lsx";
import { getWorkspacePath } from "../../utils/ws";
import { consoleWebviewLog } from "../../webview/console_webview";


export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsfConvertAll",
      () => {
        consoleWebviewLog(getWorkspacePath());
        new Lsf(getWorkspacePath()).convertModDir();
      },
    );
    return disposable;
  }
}
