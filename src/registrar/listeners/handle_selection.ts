import * as vscode from "vscode";
import { Handle } from "../../utils/uuid_handle";

export class Listener {
  setup() {
    vscode.window.onDidChangeTextEditorSelection((e) => {
      const selection: string = e.textEditor.document.getText(
        e.selections.at(-1),
      );
      const result = new Handle().re.exec(selection)?.groups?.handle;
      if (result !== undefined) {
        vscode.commands.executeCommand(
          "setContext",
          "bg3-toolkit.handleSelected",
          true,
        );
      } else {
        vscode.commands.executeCommand(
          "setContext",
          "bg3-toolkit.handleSelected",
          false,
        );
      }
    });
  }
}
