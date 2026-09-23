import * as vscode from "vscode";
import { Uuid } from "../../utils/uuid_handle";
import { getSelectionOrCursorWord } from "../../utils/ws";

export class Listener {
  setup() {
    vscode.window.onDidChangeTextEditorSelection((e) => {
      const result = new Uuid().re.exec(getSelectionOrCursorWord())?.groups
        ?.uuid;
      vscode.commands.executeCommand(
        "setContext",
        "bg3-toolkit.uuidSelected",
        result !== undefined,
      );
    });
  }
}
