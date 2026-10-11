import * as vscode from "vscode";

import { Handle } from "../../utils/uuid_handle";
import { insertAt } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.handleInsert",
      () => {
        const e = vscode.window.activeTextEditor;
        if (e === undefined) {
          return;
        }
        insertAt(new Handle().handle, e.selection);
      },
    );
    return disposable;
  }
}
