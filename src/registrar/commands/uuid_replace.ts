import * as vscode from "vscode";
import { Uuid } from "../../utils/uuid_handle";
import { editableGlob } from "../../utils/ls-formats/formats";
import { getSelectionOrCursorWord, replaceInFiles } from "../../utils/ws";
import { CommandCommon } from "../command_common";

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
