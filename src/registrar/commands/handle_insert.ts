import * as vscode from "vscode";
import { Handle } from "../../utils/uuid_handle";
import { getSelectionOrCursorWord, replaceInFiles } from "../../utils/ws";
import { CommandCommon } from "../command_common";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.handleInsert",
      () => {
        const oldHandle: string = getSelectionOrCursorWord();
        const e = vscode.window.activeTextEditor;
        if (e === undefined) {
          return;
        }
        replaceInFiles([e.document.uri], oldHandle, new Handle().handle);
      },
    );
    return disposable;
  }
}
