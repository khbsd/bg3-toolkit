import * as vscode from "vscode";
import { File } from "../../utils/ls-formats/formats";
import { convert } from "../junction";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsfConvert",
      (uri) => {
        console.log(uri.path);
        convert(new File(uri.path));
      },
    );
    return disposable;
  }
}
