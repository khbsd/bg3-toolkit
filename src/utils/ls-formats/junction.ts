import * as fs from "fs";
import * as futils from "../file";
import { getWorkspacePath } from "../ws";
import { File, FileFormats } from "./formats";
import { Loca, Xml } from "./loca_xml";
import { Lsf, Lsx } from "./lsx";
import { Pak, Unpak } from "./pak";

export function convertAll(dirPath: string, type: FileFormats) {
  if (fs.statSync(dirPath).isFile()) {
    convert(new File(dirPath));
    return;
  }

  let c = undefined;
  switch (type) {
    case FileFormats.lsx:
      c = new Lsx(dirPath);
      break;
    default:
    case FileFormats.lsf:
      c = new Lsf(dirPath);
      break;
    case FileFormats.xml:
      c = new Xml(dirPath);
      break;
    case FileFormats.loca:
      c = new Loca(dirPath);
      break;
  }

  if (c !== undefined) {
    c.convertModDir();
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
  console.log(wsPath);
  new Pak(wsPath).build();
}
