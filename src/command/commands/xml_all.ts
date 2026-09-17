import * as vscode from "vscode";
import { Xml } from "../../utils/ls-utils/loca_xml";
import { getWorkspacePath } from "../../utils/ws_utils";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.xmlConvertAll",
      () => {
        console.log(getWorkspacePath());
        new Xml(getWorkspacePath()).convertModDir();
      },
    );
    return disposable;
  }
}
