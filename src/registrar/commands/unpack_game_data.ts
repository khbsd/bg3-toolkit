import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Config } from "../../utils/config";
import { fixPath, getFiles } from "../../utils/file";
import { FileFormats } from "../../utils/ls-formats/formats";
import { Unpak } from "../../utils/ls-formats/pak";
import { getWorkspacePath } from "../../utils/ws";

export class Command {
  get(): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(
      "bg3-toolkit.unpackGameData",
      async () => {
        let pakPath: any | undefined;
        //while (pakPath === undefined) {
        const conf: Config = new Config();
        let gameData = conf.gameDataPath;
        if (gameData.length === 0) {
          gameData = getWorkspacePath();
        }
        const uri: vscode.Uri = vscode.Uri.parse(gameData);
        pakPath = await vscode.window
          .showOpenDialog({
            defaultUri: uri,
            canSelectFiles: true,
            canSelectFolders: true,
            canSelectMany: true,
            title: "Select a .pak file to unpack",
          })
          .then((p) => p);
        //}
        pakPath = fixPath(pakPath.toString());
        const unPakPath: string = path.join(path.resolve(gameData, ".."), "unpacked");

        console.log(pakPath);
        if (fs.statSync(pakPath).isFile()) {
          new Unpak(pakPath, unPakPath).unpack();
          return;
        }
        let paks = getFiles(pakPath, { type: FileFormats.pak, forUnpackingGameFiles: true });
        console.log();
        for (const pak of paks) {
          new Unpak(pak.path, unPakPath).unpack();
        }
      }
    );
    return disposable;
  }
}



