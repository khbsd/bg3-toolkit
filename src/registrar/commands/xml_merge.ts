import * as vscode from "vscode";
import { getWorkspacePath } from "../../utils/ws";
import { mergeXmlFiles } from "../../utils/file";
import { CommandCommon } from "../command_common";

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
