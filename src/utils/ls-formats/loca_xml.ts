import * as fs from "fs";

import { consoleWebviewLog } from "../../webview/console";
import { ConvertCommon, LsFile, FileFormats } from "./formats";

export class Xml extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, {
      convertOpts: { modPath: modPath },
      getFileOpts: { type: FileFormats.xml, forConversion: true },
    });
    this._cf = this.convertFile;
  }

  public convertFile(f: LsFile) {
    if (f.out_ext === FileFormats[FileFormats.none]) {
      consoleWebviewLog("not converting Fileformats.none file. returning...");
      return;
    }

    let outContents: Uint8Array;
    try {
      outContents = this.builder.convert_xml_to_loca(
        fs.readFileSync(f.path).toString(),
      );
      fs.writeFileSync(f.out_path, Buffer.from(outContents), {
        flag: "w",
      });
      consoleWebviewLog("wrote loca file: " + f.out_path);
    } catch (err) {
      consoleWebviewLog(err);
    }
  }
}

export class Loca extends ConvertCommon {
  constructor(wsPath: string, modPath?: string | undefined) {
    super(wsPath, {
      convertOpts: { modPath: modPath },
      getFileOpts: { type: FileFormats.loca, forConversion: true },
    });
    this._cf = this.convertFile;
  }

  public convertFile(f: LsFile) {
    if (f.out_ext === FileFormats[FileFormats.none]) {
      consoleWebviewLog("not converting Fileformats.none file. returning...");
      return;
    }

    let outContents: string;
    try {
      outContents = this.builder
        .convert_loca_to_xml(new Uint8Array(fs.readFileSync(f.path)))
        .toString();
      fs.writeFileSync(f.out_path, outContents, {
        flag: "w",
      });
      consoleWebviewLog("wrote xml file: " + f.out_path);
    } catch (err) {
      consoleWebviewLog(err);
    }
  }
}
