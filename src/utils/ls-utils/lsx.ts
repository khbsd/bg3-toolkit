import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";
import * as formats from "./formats";
import * as futils from "../file_utils";

// TODO: this

// const lsb, lsf, lsj, lsfx, lsbc, lsbs, lsx;
// const lsfFormats = [lsb, lsf, lsj, lsfx, lsbc, lsbs, lsx];
// all these convert to lsf, but need to convert back to their respective formats
// probably should check in their folders to see if theres a file with the same name
// but a different extension

export class Lsx {
  builder;
  wsPath: string;
  modPath: string;
  paths: fs.Dirent[];
  type: string = ".lsx";
  constructor(wsPath: string, modPath?: string | undefined) {
    this.builder = lsPak;
    this.wsPath = futils.fixPath(wsPath);
    this.modPath = modPath ?? futils.getModPath(this.wsPath);
    this.paths = futils.getFiles(this.modPath, this.type, true);
  }

  public convert() {
    for (let p of this.paths) {
      console.log(new formats.FileType(path.join(p.parentPath, p.name)));
    }
  }
}
