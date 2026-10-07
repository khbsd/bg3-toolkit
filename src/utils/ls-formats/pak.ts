import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";

import * as futils from "../file";
import { ConvertCommon, FileFormats } from "./formats";
import { Xml } from "./loca_xml";
import { Lsx } from "./lsx";

import { consoleWebviewLog } from "../../webview/console_webview";

function convertFilesForPacking(wsPath: string): void {
  new Lsx(wsPath).convertModDir();
  new Xml(wsPath).convertModDir();
}

export class Pak extends ConvertCommon {
  vscode: any;
  constructor(wsPath: string, modPath?: string | undefined) {
    wsPath = futils.fixPath(wsPath);

    // needs to be called before super() so that converted files exist before the ConvertCommon class collects them.
    convertFilesForPacking(wsPath);

    super(wsPath, { type: FileFormats.pak, modPath: modPath });
    this.vscode = require("vscode");
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
      this.vscode.window.showInformationMessage(name + " packed!");

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
        this.vscode.window.showInformationMessage(
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
    this.unpakPath = unpakPath ?? path.resolve(this.wsPath, "..");
  }

  public async unpack(): Promise<void> {
    if (
      !path.basename(this.wsPath).includes("." + FileFormats[FileFormats.pak])
    ) {
      return;
    }
    let unpacked: lsPak.ModFile[];

    consoleWebviewLog(".pak file found at " + this.wsPath + ", unpacking");

    try {
      unpacked = lsPak.unpack(fs.readFileSync(this.wsPath));
      consoleWebviewLog(unpacked);
    } catch (err) {
      consoleWebviewLog(err);
      return;
    }

    for (const file of unpacked) {
      let fullPath: string = path.join(this.unpakPath, file.extract_path());
      try {
        fs.mkdir(path.resolve(fullPath, ".."), { recursive: true }, (err) => {
          consoleWebviewLog(err);
        });
        fs.writeFile(fullPath, Buffer.from(file.extract_contents()), (err) => {
          consoleWebviewLog(err);
        });
      } catch (err) {
        consoleWebviewLog(err);
      }
    }
  }
}
