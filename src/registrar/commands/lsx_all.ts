import * as vscode from "vscode";
import { Lsx } from "../../utils/ls-formats/lsx";
import { getWorkspacePath } from "../../utils/ws";
import { consoleWebviewLog } from "../../webview/console_webview";


export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsxConvertAll",
      () => {
        consoleWebviewLog(getWorkspacePath());
        new Lsx(getWorkspacePath()).convertModDir();
      },
    );
    return disposable;
  }
}
