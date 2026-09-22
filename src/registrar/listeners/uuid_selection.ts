import * as vscode from "vscode";
import { Uuid } from "../../utils/uuid_handle";

export class Listener {
  setup() {
    vscode.window.onDidChangeTextEditorSelection((e) => {
      const selection: string = e.textEditor.document.getText(
        e.selections.at(-1),
      );
      const result = new Uuid().re.exec(selection)?.groups?.uuid;
      if (result !== undefined) {
        vscode.commands.executeCommand(
          "setContext",
          "bg3-toolkit.uuidSelected",
          true,
        );
      } else {
        vscode.commands.executeCommand(
          "setContext",
          "bg3-toolkit.uuidSelected",
          false,
        );
      }
    });
  }
}
