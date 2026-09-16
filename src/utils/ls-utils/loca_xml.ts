import * as fs from "fs";
import { FileFormats, File, ConvertCommon } from "./formats";

export class Xml extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, FileFormats.xml, modPath);
    this._cf = this.convertFile;
  }

  public convertFile(f: File) {
    let outContents: Uint8Array;
    try {
      outContents = this.builder.convert_xml_to_loca(
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

export class Loca extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, FileFormats.loca, modPath);
    this._cf = this.convertFile;
  }

  public convertFile(f: File) {
    let outContents: string;
    try {
      outContents = this.builder
        .convert_loca_to_xml(new Uint8Array(fs.readFileSync(f.path)))
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
