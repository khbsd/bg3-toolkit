import * as fs from "fs";
import * as path from "path";
import * as eutils from "../enum_utils";
import * as futils from "../file_utils";
import * as wsutils from "../ws_utils";

export enum FileFormats {
  lsx,
  xml,
  // non-editable below this line
  lsf,
  lsfx,
  lsfex,
  lsb,
  lsbc,
  lsbs,
  lsj,
  loca,
  pak,
  count,
}

export const EditableFormats: FileFormats[] = [
  FileFormats.lsx,
  FileFormats.xml,
];

export enum CompressionType {
  lsf,
  loca,
  count,
}

export function isEditable(ext: string): boolean {
  let isEdit: boolean = false;
  if (ext.startsWith(".")) {
    ext = ext.slice(1);
  }
  for (const ef of EditableFormats) {
    isEdit = FileFormats[ef] === ext;
    if (isEdit) {
      break;
    }
  }
  return isEdit;
}

export class File {
  name: string;
  path: string;
  compressionType: CompressionType;
  ext: string;
  out_path: string;
  out_ext: string;
  constructor(fp: string, wsPath?: string) {
    this.name = path.basename(fp, path.extname(fp));
    this.ext = path.extname(fp).slice(1);
    this.path = fp;
    this.compressionType = this.getCompressionType();
    this.out_path = this.toExt();
    this.out_ext = path.extname(this.out_path).slice(1);
  }

  public getCompressionType(): CompressionType {
    let c: CompressionType = CompressionType.lsf;

    switch (FileFormats[this.ext as keyof typeof FileFormats]) {
      case FileFormats.xml:
      case FileFormats.loca: {
        c = CompressionType.loca;
      }
    }
    return c;
  }

  public isEditable(ext?: string): boolean {
    ext = ext ?? this.ext;
    return eutils.getNames(FileFormats).includes(ext);
  }

  public toExt(ext?: string): string {
    let sourceExt: string = ext ?? this.ext;
    let tempPath: string = path.resolve(this.path, "..");
    let targetFile: string = "";
    fs.readdirSync(tempPath, { withFileTypes: true }).forEach((entry) => {
      if (
        !entry.name.includes("." + sourceExt) &&
        entry.name.includes(this.name) &&
        !entry.name.includes(".bak")
      ) {
        targetFile = path.join(entry.parentPath, entry.name);
      }
    });

    if (
      targetFile.length === 0 &&
      Object(FileFormats).hasOwnProperty(sourceExt)
    ) {
      switch (FileFormats[sourceExt as keyof typeof FileFormats]) {
        case FileFormats.lsx: {
          targetFile = path.join(
            this.name + "." + FileFormats[FileFormats.lsf],
          );
        }
        case FileFormats.xml: {
          targetFile = path.join(
            this.name + "." + FileFormats[FileFormats.loca],
          );
        }
        default:
        case FileFormats.lsf:
        case FileFormats.lsfx:
        case FileFormats.lsfex:
        case FileFormats.lsb:
        case FileFormats.lsbc:
        case FileFormats.lsbs: {
          targetFile = path.join(
            this.name + "." + FileFormats[FileFormats.lsx],
          );
        }
        case FileFormats.loca: {
          targetFile = path.join(
            this.name + "." + FileFormats[FileFormats.xml],
          );
        }
      }
    }

    return targetFile;
  }
}
