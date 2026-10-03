import * as vscode from "vscode";
import { editableGlob } from "../../utils/ls-formats/formats";
import { Handle } from "../../utils/uuid_handle";
import { getSelectionOrCursorWord, replaceInFiles } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.handleReplace",
      async () => {
        const oldHandle = getSelectionOrCursorWord();

        await replaceInFiles(
          await vscode.workspace.findFiles(editableGlob),
          oldHandle,
          new Handle().handle,
        );
      },
    );
    return disposable;
  }
}
