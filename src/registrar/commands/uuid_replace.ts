import * as vscode from "vscode";
import { editableGlob } from "../../utils/ls-formats/formats";
import { Uuid } from "../../utils/uuid_handle";
import { getSelectionOrCursorWord, replaceInFiles } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.uuidReplace",
      async () => {
        const oldUuid = getSelectionOrCursorWord();

        await replaceInFiles(
          await vscode.workspace.findFiles(editableGlob),
          oldUuid,
          new Uuid().uuid,
        );
      },
    );
    return disposable;
  }
}
