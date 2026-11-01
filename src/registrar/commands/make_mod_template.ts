import * as vscode from "vscode";

import { makeModTemplate } from "../../utils/templates/template";
import { getWorkspacePath } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.makeModTemplate",
      () => {
        makeModTemplate(getWorkspacePath());
      },
    );
    return disposable;
  }
}
