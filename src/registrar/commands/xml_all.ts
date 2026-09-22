import * as vscode from "vscode";
import { Xml } from "../../utils/ls-formats/loca_xml";
import { getWorkspacePath } from "../../utils/ws";
import { CommandCommon } from "../command_common";

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
