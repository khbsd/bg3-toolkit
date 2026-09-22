import * as vscode from "vscode";
import { File } from "../../utils/ls-formats/formats";
import { convert } from "../junction";
import { CommandCommon } from "../command_common";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.lsxConvert",
      (uri) => {
        console.log(uri.path);
        convert(new File(uri.path));
      },
    );
    return disposable;
  }
}
