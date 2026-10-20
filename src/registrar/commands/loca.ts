import * as vscode from "vscode";

import { LsFile } from "../../utils/ls-formats/formats";
import { convert } from "../../utils/ls-formats/junction";
import { consoleWebviewLog } from "../../webview/console";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.locaConvert",
      (uri) => {
        consoleWebviewLog(uri.path);
        convert(new LsFile(uri.path));
      },
    );
    return disposable;
  }
}
