import { FileFormats, File } from "../utils/ls-utils/formats";
import { Lsx, Lsf } from "../utils/ls-utils/lsx";
import { Pak, Unpak } from "../utils/ls-utils/pak";
import { Loca, Xml } from "../utils/ls-utils/loca_xml";
import * as futils from "../utils/file_utils";
import * as fs from "fs";
import * as path from "path";

export class ConvertAll {
  files: File[] = [];
  path: string;
  constructor(dirPath: string, type: FileFormats) {
    if (fs.statSync(dirPath).isFile()) {
      this.path = futils.getModPath(dirPath);
    } else {
      this.path = dirPath;
    }
    futils.getFiles(dirPath, FileFormats[type], true).forEach((file) => {
      this.files.push(new File(path.join(file.parentPath, file.name)));
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
