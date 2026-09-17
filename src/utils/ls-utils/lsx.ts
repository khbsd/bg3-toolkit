import * as fs from "fs";
import { FileFormats, File, ConvertCommon } from "./formats";

export class Lsx extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, FileFormats.lsx, modPath);
    this._cf = this.convertFile;
  }

  public convertFile(f: File) {
    console.log(f);
    let outContents: Uint8Array;
    try {
      outContents = this.builder.convert_lsx_to_lsf(
        fs.readFileSync(f.path).toString(),
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

export class Lsf extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, FileFormats.lsf, modPath);
    this._cf = this.convertFile;
  }

  public convertFile(f: File) {
    console.log(f);
    let outContents: string;
    try {
      outContents = this.builder
        .convert_lsf_to_lsx(new Uint8Array(fs.readFileSync(f.path)))
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
