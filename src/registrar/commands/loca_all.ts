import * as vscode from "vscode";
import { Loca } from "../../utils/ls-formats/loca_xml";
import { getWorkspacePath } from "../../utils/ws";
import { consoleWebviewLog } from "../../webview/console_webview";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.locaConvertAll",
      () => {
        consoleWebviewLog(getWorkspacePath());
        new Loca(getWorkspacePath()).convertModDir();
      },
    );
    return disposable;
  }
}
