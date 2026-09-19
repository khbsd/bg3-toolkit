import * as vscode from "vscode";
import { Loca } from "../../utils/ls-formats/loca_xml";
import { getWorkspacePath } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.locaConvertAll",
      () => {
        console.log(getWorkspacePath());
        new Loca(getWorkspacePath()).convertModDir();
      },
    );
    return disposable;
  }
}
