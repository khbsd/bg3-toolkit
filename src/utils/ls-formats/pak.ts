import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";
import * as vscode from "vscode";

import * as futils from "../file";
import { ConvertCommon, FileFormats } from "./formats";

import { consoleWebviewLog } from "../../webview/console_webview";
import { Config } from "../config";
import { convertAll } from "./junction";

function convertFilesForPacking(wsPath: string): void {
  convertAll(wsPath, FileFormats.lsx);
  convertAll(wsPath, FileFormats.xml);
}

export class Pak extends ConvertCommon {
  type: FileFormats = FileFormats.pak;
  constructor(wsPath: string, modPath?: string | undefined) {
    wsPath = futils.fixPath(wsPath);

    // needs to be called before super() so that converted files exist before the ConvertCommon class collects them.
    convertFilesForPacking(wsPath);

    super(wsPath, { modPath: modPath }, { forPacking: true, forRemovingEditables: new Config().doNotPackEditables });
  }

  public build(): void {
    let builder = new lsPak.PakBuilder();

    for (let file of this.files) {
      let fContents = fs.readFileSync(file.path);
      const relPath: string = futils.getRelativeModPath(
        this.modPath,
        file.path,
      );
      consoleWebviewLog("adding file: " + relPath);
      try {
        builder.add_file(relPath, new Uint8Array(fContents));
      } catch (err) {
        consoleWebviewLog(err);
      }
    }

    try {
      const packed: Uint8Array = builder.pack();
      const name: string =
        futils.getModName(this.modPath) + "." + FileFormats[this.type];
      const modDestPath: string = path.join(this.wsPath, name);

      fs.writeFileSync(modDestPath, Buffer.from(packed), { flag: "w+" });
      vscode.window.showInformationMessage(name + " packed!");

      let installPath: string = this.conf.installedModsPath;
      let verb: string = "copied";
      if (installPath.length > 0) {
        installPath = path.join(installPath, name);
        fs.copyFileSync(modDestPath, installPath);
        if (this.conf.copyOrMoveOnPak === "move") {
          fs.rmSync(modDestPath);
          verb = "moved";
        }

        let consoleText = name + " " + verb + " to " + installPath;

        consoleWebviewLog(consoleText);
        vscode.window.showInformationMessage(
          consoleText,
        );
      }
    } catch (err) {
      consoleWebviewLog(err);
    }
  }
}

// doesnt need to extend anything since its all contained in the pak
export class Unpak {
  wsPath: string;
  unpakPath: string;
  constructor(wsPath: string, unpakPath?: string) {
    this.wsPath = futils.fixPath(wsPath);
    this.unpakPath = futils.fixPath(unpakPath ?? path.resolve(this.wsPath, ".."));
  }

  public unpack(): void {
    if (
      !path.basename(this.wsPath).includes("." + FileFormats[FileFormats.pak])
    ) {
      return;
    }

    consoleWebviewLog(".pak file found at " + this.wsPath + ", unpacking");

    let unpacked: lsPak.ModFile[];
    try {
      unpacked = lsPak.unpack(fs.readFileSync(this.wsPath));
    } catch (err) {
      consoleWebviewLog(err);
      return;
    }

    for (const file of unpacked) {
      let fullPath: string = path.join(this.unpakPath, file.extract_path());
      let dirPath: string = path.resolve(fullPath, "..");
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        if (fs.statSync(dirPath).isDirectory()) {
          fs.writeFileSync(fullPath, Buffer.from(file.extract_contents()));
        };
        consoleWebviewLog("wrote file: " + fullPath);
      } catch (err) {
        consoleWebviewLog(err);
      }
    }
  }
}
