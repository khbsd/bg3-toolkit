import * as vscode from "vscode";
import { Uuid } from "../../utils/uuid_handle";
import { insertAt } from "../../utils/ws";
import { CommandCommon } from "../command_common";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.uuidInsert",
      () => {
        const e = vscode.window.activeTextEditor;
        if (e === undefined) {
          return;
        }
        insertAt(new Uuid().uuid, e.selection);
      },
    );
    return disposable;
  }
}
