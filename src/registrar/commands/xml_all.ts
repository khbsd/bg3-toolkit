import * as vscode from "vscode";
import { Xml } from "../../utils/ls-formats/loca_xml";
import { getWorkspacePath } from "../../utils/ws";
import { consoleWebviewLog } from "../../webview/console_webview";


export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.xmlConvertAll",
      () => {
        consoleWebviewLog(getWorkspacePath());
        new Xml(getWorkspacePath()).convertModDir();
      },
    );
    return disposable;
  }
}
