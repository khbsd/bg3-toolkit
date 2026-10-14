import * as fs from "fs";

import { consoleWebviewLog } from "../../webview/console";
import { ConvertCommon, File, FileFormats } from "./formats";

export class Lsx extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, { modPath: modPath }, { type: FileFormats.lsx, forConversion: true });
    this._cf = this.convertFile;
  }

  public convertFile(f: File) {
    if (f.out_ext === FileFormats[FileFormats.none]) {
      consoleWebviewLog("not converting Fileformats.none file. returning...");
      return;
    }

    let outContents: Uint8Array;
    try {
      outContents = this.builder.convert_lsx_to_lsf(
        fs.readFileSync(f.path).toString(),
      );
      consoleWebviewLog("writing: " + f.name);
      fs.writeFileSync(f.out_path, Buffer.from(outContents), {
        flag: "w",
      });
    } catch (err) {
      consoleWebviewLog(err);
    }
  }
}

export class Lsf extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, { modPath: modPath }, { type: FileFormats.lsf, forConversion: true });
    this._cf = this.convertFile;
  }

  public convertFile(f: File) {
    if (f.out_ext === FileFormats[FileFormats.none]) {
      consoleWebviewLog("not converting Fileformats.none file. returning...");
      return;
    }

    let outContents: string;
    try {
      outContents = this.builder
        .convert_lsf_to_lsx(new Uint8Array(fs.readFileSync(f.path)))
        .toString();
      consoleWebviewLog("writing: " + f.name);
      fs.writeFileSync(f.out_path, outContents, {
        flag: "w",
      });
    } catch (err) {
      consoleWebviewLog(err);
    }
  }
}
