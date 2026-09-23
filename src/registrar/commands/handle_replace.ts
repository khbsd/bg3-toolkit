import * as vscode from "vscode";
import { Handle } from "../../utils/uuid_handle";
import { getSelectionOrCursorWord, replaceInFiles } from "../../utils/ws";
import { editableGlob } from "../../utils/ls-formats/formats";
import { CommandCommon } from "../command_common";

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
