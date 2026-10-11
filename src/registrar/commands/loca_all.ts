import * as vscode from "vscode";
import { FileFormats } from "../../utils/ls-formats/formats";
import { convertAll } from "../../utils/ls-formats/junction";
import { getWorkspacePath } from "../../utils/ws";
import { consoleWebviewLog } from "../../webview/console_webview";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.locaConvertAll",
      () => {
        consoleWebviewLog(getWorkspacePath());
        convertAll(getWorkspacePath(), FileFormats.loca);
      },
    );
    return disposable;
  }
}
