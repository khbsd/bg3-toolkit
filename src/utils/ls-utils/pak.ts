import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";

import * as futils from "../file_utils";

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
      let fPath = path.join(file.parentPath, file.name);
      let fContents = fs.readFileSync(fPath);
      try {
        this.builder.add_file(futils.getRelativeModPath(this.modPath, fPath), new Uint8Array(fContents));
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

      //console.log(modDestPath);
      fs.writeFileSync(modDestPath, Buffer.from(packed), { flag: "w+" });
    } catch (err) {
      console.log(err);
    }
  }
}
