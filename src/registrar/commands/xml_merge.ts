import * as vscode from "vscode";

import { mergeXmlFiles } from "../../utils/xml";
import { getWorkspacePath } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.xmlMerge",
      () => {
        mergeXmlFiles(getWorkspacePath());
      },
    );
    return disposable;
  }
}
