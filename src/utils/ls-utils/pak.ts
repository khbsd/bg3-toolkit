import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";

import * as futils from "../file_utils";
import { FileFormats } from "./formats";

export class Pak {
  builder: lsPak.PakBuilder;
  wsPath: string;
  paths: fs.Dirent[];
  modPath: string;
  constructor(wsPath: string, modPath: string | undefined = undefined) {
    this.builder = new lsPak.PakBuilder();
    this.wsPath = futils.fixPath(wsPath);
    this.modPath = modPath ?? futils.getModPath(this.wsPath);
    this.paths = futils.getFiles(this.modPath);
  }

  public build() {
    for (let file of this.paths) {
      let fullPath = path.join(file.parentPath, file.name);
      let fContents = fs.readFileSync(fullPath);
      console.log(
        "adding file: ",
        futils.getRelativeModPath(this.modPath, fullPath),
      );
      try {
        this.builder.add_file(
          futils.getRelativeModPath(this.modPath, fullPath),
          new Uint8Array(fContents),
        );
      } catch (err) {
        console.log(err);
      }
    }

    try {
      let packed = this.builder.pack();
      let modDestPath = path.join(
        this.wsPath,
        futils.getModName(this.modPath) + ".pak",
      );

      // console.log("packing file: ", modDestPath);
      fs.writeFileSync(modDestPath, Buffer.from(packed), { flag: "w+" });
    } catch (err) {
      console.log(err);
    }
  }
}

export class Unpak {
  wsPath: string;
  unpakPath: string;
  constructor(wsPath: string, unpakPath?: string) {
    this.unpakPath = unpakPath ?? path.resolve(futils.fixPath(wsPath), "..");
    this.wsPath = futils.fixPath(wsPath);
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
