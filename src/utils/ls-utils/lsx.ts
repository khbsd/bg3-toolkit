import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";
import * as formats from "./formats";
import * as futils from "../file_utils";
import { FileFormats } from "./formats";

export class Lsx {
  builder;
  wsPath: string;
  modPath: string;
  paths: fs.Dirent[];
  type: string = FileFormats[FileFormats.lsx];
  constructor(wsPath: string, modPath?: string | undefined) {
    this.builder = lsPak;
    this.wsPath = futils.fixPath(wsPath);
    this.modPath = modPath ?? futils.getModPath(this.wsPath);
    this.paths = futils.getFiles(this.modPath, this.type, true);
  }

  public convert() {
    for (let p of this.paths) {
      console.log(new formats.File(path.join(p.parentPath, p.name)));
    }
  }
}
