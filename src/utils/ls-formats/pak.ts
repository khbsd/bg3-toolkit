import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";
import * as vscode from "vscode";
import * as futils from "../file";

import { consoleWebviewLog } from "../../webview/console";
import { Config } from "../config";
import { ConvertCommon, FileFormats } from "./formats";
import { convertAll } from "./junction";
import { mergeXmlFiles } from "../xml";

function convertFilesForPacking(wsPath: string): void {
  mergeXmlFiles(wsPath);
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


/**
 *
 * wrapper func for Unpak() that grabs the pak path and the destination path from the user
 */
export async function unpackChoose(): Promise<void> {
  let pakPath: string | undefined;
  let unpakPath: string | undefined;
  while (pakPath === undefined) {
    pakPath = await vscode.window
      .showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { "PAK Files": ["pak"] },
        title: "Select a .pak file to unpack",
      })
      .then((p) => p?.toString());

    if (pakPath === undefined) {
      let warning;
      await vscode.window
        .showWarningMessage(
          "You must select a pak!",
          "oops",
          "never mind",
        )
        .then((value) => {
          warning = value;
        });
      if (warning !== "oops") {
        return;
      }
    }
  }
  while (unpakPath === undefined) {
    unpakPath = await vscode.window
      .showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: "Select a location to unpack to",
      })
      .then((p) => p?.toString());

    if (unpakPath === undefined) {
      let warning;
      await vscode.window
        .showWarningMessage(
          "You must select a destination!",
          "oops",
          "never mind",
        )
        .then((value) => {
          warning = value;
        });

      if (warning !== "oops") {
        return;
      }
    }
  }

  Unpak(pakPath, unpakPath);
  return;
}

export function Unpak(wsPath: string, unpakPath?: string) {
  wsPath = futils.fixPath(wsPath);
  unpakPath = futils.fixPath(unpakPath ?? path.resolve(wsPath, ".."));

  if (
    !path.basename(wsPath).includes("." + FileFormats[FileFormats.pak])
  ) {
    return;
  }

  consoleWebviewLog(".pak file found at " + wsPath + ", unpacking");

  let unpacked: lsPak.ModFile[];
  try {
    unpacked = lsPak.unpack(fs.readFileSync(wsPath));
  } catch (err) {
    consoleWebviewLog(err);
    return;
  }

  for (const file of unpacked) {
    let fullPath: string = path.join(unpakPath, file.extract_path());
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
