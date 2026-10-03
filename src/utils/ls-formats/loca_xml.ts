import * as fs from "fs";
import { ConvertCommon, File, FileFormats } from "./formats";

export class Xml extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, { type: FileFormats.xml, modPath: modPath });
    this._cf = this.convertFile;
  }

  public convertFile(f: File) {
    let outContents: Uint8Array;
    try {
      outContents = this.builder.convert_xml_to_loca(
        fs.readFileSync(f.path).toString(),
      );
      fs.writeFileSync(f.out_path, Buffer.from(outContents), {
        flag: "w",
      });
      console.log("wrote loca file: ", f.out_path);
    } catch (err) {
      console.log(err);
    }
  }
}

export class Loca extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, { type: FileFormats.loca, modPath: modPath });
    this._cf = this.convertFile;
  }

  public convertFile(f: File) {
    let outContents: string;
    try {
      outContents = this.builder
        .convert_loca_to_xml(new Uint8Array(fs.readFileSync(f.path)))
        .toString();
      fs.writeFileSync(f.out_path, outContents, {
        flag: "w",
      });
      console.log("wrote xml file: ", f.out_path);
    } catch (err) {
      console.log(err);
    }
  }
}
