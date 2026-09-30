import * as vscode from "vscode";
import { Handle } from "../../utils/uuid_handle";
import { getSelectionOrCursorWord, replaceInFiles } from "../../utils/ws";
import { editableGlob } from "../../utils/ls-formats/formats";
import { CommandCommon } from "../command_common";
import { addHandleToXml } from "../../utils/file";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.addToXml",
      async () => {
        addHandleToXml(getSelectionOrCursorWord());
      },
    );
    return disposable;
  }
}
