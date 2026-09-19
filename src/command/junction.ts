import { FileFormats, File } from "../utils/ls-formats/formats";
import { Lsx, Lsf } from "../utils/ls-formats/lsx";
import { Pak, Unpak } from "../utils/ls-formats/pak";
import { Loca, Xml } from "../utils/ls-formats/loca_xml";
import * as futils from "../utils/file";
import * as fs from "fs";
import { getWorkspacePath } from "../utils/ws";

export class ConvertAll {
  files: File[] = [];
  path: string;
  constructor(dirPath: string, type: FileFormats) {
    if (fs.statSync(dirPath).isFile()) {
      this.path = futils.getModPath(dirPath);
    } else {
      this.path = dirPath;
    }
    this.files = futils.getFiles(dirPath, {
      type: FileFormats[type],
      forConversion: true,
    });
    this._convertAll();
  }
  private _convertAll() {
    this.files.forEach((file) => {
      convert(file);
    });
  }
}

export function convert(file: File) {
  let c = undefined;
  switch (FileFormats[file.ext as keyof typeof FileFormats]) {
    case FileFormats.lsx:
      c = new Lsx(file.path);
      break;
    default:
    case FileFormats.lsf:
      c = new Lsf(file.path);
      break;
    case FileFormats.xml:
      c = new Xml(file.path);
      break;
    case FileFormats.loca:
      c = new Loca(file.path);
      break;
    case FileFormats.pak:
      let u = new Unpak(file.path);
      u.unpack();
      return;
  }
  if (c !== undefined) {
    c.convertFile(file);
  }
}

export function pack(wsPath?: string) {
  wsPath = wsPath ?? getWorkspacePath();
  new Pak(wsPath).build();
}
