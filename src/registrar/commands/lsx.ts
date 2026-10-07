import * as vscode from "vscode";
import { File } from "../../utils/ls-formats/formats";
import { convert } from "../../utils/ls-formats/junction";
import { consoleWebviewLog } from "../../webview/console_webview";


export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsxConvert",
      (uri) => {
        consoleWebviewLog(uri.path);
        convert(new File(uri.path));
      },
    );
    return disposable;
  }
}
