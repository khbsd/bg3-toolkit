import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";

import * as futils from "../file";
import { Lsx } from "./lsx";
import { Xml } from "./loca_xml";
import { FileFormats, ConvertCommon } from "./formats";

export class Pak extends ConvertCommon {
  vscode: any;
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, { type: FileFormats.pak, modPath: modPath });
    this.vscode = require("vscode");
  }

  public build(): void {
    let builder = new lsPak.PakBuilder();
    new Lsx(this.wsPath).convertModDir();
    new Xml(this.wsPath).convertModDir();

    for (let file of this.files) {
      let fContents = fs.readFileSync(file.path);
      const relPath: string = futils.getRelativeModPath(
        this.modPath,
        file.path,
      );
      console.log("adding file: ", relPath);
      try {
        builder.add_file(relPath, new Uint8Array(fContents));
      } catch (err) {
        console.log(err);
      }
    }

    try {
      const packed: Uint8Array = builder.pack();
      const name: string =
        futils.getModName(this.modPath) + "." + FileFormats[this.type];
      const modDestPath: string = path.join(this.wsPath, name);

      // console.log("packing file: ", modDestPath);
      fs.writeFileSync(modDestPath, Buffer.from(packed), { flag: "w+" });
      this.vscode.window.showInformationMessage(name + " packed!");

      let installPath: string = this.conf.installedModsPath;
      if (installPath.length > 0) {
        installPath = path.join(installPath, name);
        fs.copyFileSync(modDestPath, installPath);

        this.vscode.window.showInformationMessage(
          name + " copied to " + installPath,
        );
      }
    } catch (err) {
      console.log(err);
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

  public unpack(): void {
    if (
      !path.basename(this.wsPath).includes("." + FileFormats[FileFormats.pak])
    ) {
      return;
    }
    let unpacked: lsPak.ModFile[];

    console.log(".pak file found at " + this.wsPath + ", unpacking");

    try {
      unpacked = lsPak.unpack(fs.readFileSync(this.wsPath));
      console.log(unpacked);
    } catch (err) {
      console.log(err);
      return;
    }

    for (const file of unpacked) {
      console.log(file);
      let fullPath: string = path.join(
        futils.getModPath(path.resolve(this.wsPath, "..")),
        file.extract_path(),
      );
      try {
        fs.writeFileSync(fullPath, Buffer.from(file.extract_contents()), {
          flag: "w",
        });
        console.log(fullPath);
      } catch (err) {
        console.log(err);
      }
    }
  }
}
