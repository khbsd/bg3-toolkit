import * as vscode from "vscode";

import { addHandleToXml } from "../../utils/xml";
import { getSelectionOrCursorWord } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.addToXml",
      async () => {
        addHandleToXml({ handle: getSelectionOrCursorWord() });
      },
    );
    return disposable;
  }
}
