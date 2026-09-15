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
      const fullPath: string = path.join(p.parentPath, p.name);
      let f = new formats.File(fullPath);
      let outContents: Uint8Array;
      try {
        outContents = this.builder.convert_lsx_to_lsf(
          fs.readFileSync(fullPath).toString(),
        );
        console.log("writing: ", f.name);
        fs.writeFileSync(f.out_path, Buffer.from(outContents), {
          flag: "w",
        });
      } catch (err) {
        console.log(err);
      }
    }
  }
}

export class Lsf {
  builder;
  wsPath: string;
  modPath: string;
  paths: fs.Dirent[];
  type: string = FileFormats[FileFormats.lsf];
  constructor(wsPath: string, modPath?: string | undefined) {
    this.builder = lsPak;
    this.wsPath = futils.fixPath(wsPath);
    this.modPath = modPath ?? futils.getModPath(this.wsPath);
    this.paths = futils.getFiles(this.modPath, this.type, true);
  }

  public convert() {
    for (let p of this.paths) {
      const fullPath: string = path.join(p.parentPath, p.name);
      let f = new formats.File(fullPath);
      let outContents: string;
      console.log(p.name);
      try {
        outContents = this.builder
          .convert_lsf_to_lsx(new Uint8Array(fs.readFileSync(fullPath)))
          .toString();
        console.log("writing: ", f.name);
        fs.writeFileSync(f.out_path, outContents, {
          flag: "w",
        });
      } catch (err) {
        console.log(err);
      }
    }
  }
}
