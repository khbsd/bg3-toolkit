import * as vscode from "vscode";
import { Handle } from "../../utils/uuid_handle";
import { getSelectionOrCursorWord } from "../../utils/ws";
import { CommandCommon } from "../command_common";

export class Listener {
  setup() {
    vscode.window.onDidChangeTextEditorSelection((e) => {
      const result = new Handle().re.exec(getSelectionOrCursorWord())?.groups
        ?.handle;
      vscode.commands.executeCommand(
        "setContext",
        "bg3-toolkit.handleSelected",
        result !== undefined,
      );
    });
  }
}
