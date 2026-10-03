import * as vscode from "vscode";
import { addHandleToXml } from "../../utils/file";
import { getSelectionOrCursorWord } from "../../utils/ws";

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
