import * as fs from "fs";
import * as lsPak from "larian-formats-wasm";
import * as path from "path";
import * as formats from "./formats";
import * as futils from "../file_utils";
import { FileFormats } from "./formats";

// TODO: this

// const lsb, lsf, lsj, lsfx, lsbc, lsbs, lsx;
// const lsfFormats = [lsb, lsf, lsj, lsfx, lsbc, lsbs, lsx];
// all these convert to lsf, but need to convert back to their respective formats
// probably should check in their folders to see if theres a file with the same name
// but a different extension

export class Xml {
  builder;
  wsPath: string;
  modPath: string;
  paths: fs.Dirent[];
  type: string = FileFormats[FileFormats.xml];
  constructor(wsPath: string, modPath?: string | undefined) {
    this.builder = lsPak;
    this.wsPath = futils.fixPath(wsPath);
    this.modPath = modPath ?? futils.getModPath(this.wsPath);
    this.paths = futils.getFiles(this.modPath, this.type, true);
  }

  public fileObjBuilder() {}

  public convert() {
    for (let p of this.paths) {
      const fullPath: string = path.join(p.parentPath, p.name);
      let f = new formats.File(fullPath);
      let outContents: Uint8Array;
      try {
        outContents = this.builder.convert_xml_to_loca(
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

export class Loca {
  builder;
  wsPath: string;
  modPath: string;
  paths: fs.Dirent[];
  type: string = FileFormats[FileFormats.loca];
  constructor(wsPath: string, modPath?: string | undefined) {
    this.builder = lsPak;
    this.wsPath = futils.fixPath(wsPath);
    this.modPath = modPath ?? futils.getModPath(this.wsPath);
    this.paths = futils.getFiles(this.modPath, this.type, true);
  }

  public fileObjBuilder() {}

  public convert() {
    for (let p of this.paths) {
      const fullPath: string = path.join(p.parentPath, p.name);
      let f = new formats.File(fullPath);
      let outContents: string;
      try {
        outContents = this.builder
          .convert_loca_to_xml(new Uint8Array(fs.readFileSync(fullPath)))
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
