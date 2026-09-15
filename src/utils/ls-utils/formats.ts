import * as fs from "fs";
import * as path from "path";
import * as eutils from "../enum_utils";
import * as futils from "../file_utils";
import * as wsutils from "../ws_utils";

export enum FileTypes {
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

export const EditableTypes: FileTypes[] = [FileTypes.lsx, FileTypes.xml];

export enum CompressionType {
  lsf,
  loca,
  count,
}

export class FileType {
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

    switch (FileTypes[this.ext as keyof typeof FileTypes]) {
      case FileTypes.xml:
      case FileTypes.loca: {
        c = CompressionType.loca;
      }
    }
    return c;
  }

  public isEditable(ext?: string): boolean {
    ext = ext ?? this.ext;
    return eutils.getNames(FileTypes).includes(ext);
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
      Object(FileTypes).hasOwnProperty(sourceExt)
    ) {
      switch (FileTypes[sourceExt as keyof typeof FileTypes]) {
        case FileTypes.lsx: {
          targetFile = path.join(this.name + "." + FileTypes[FileTypes.lsf]);
        }
        case FileTypes.xml: {
          targetFile = path.join(this.name + "." + FileTypes[FileTypes.loca]);
        }
        default:
        case FileTypes.lsf:
        case FileTypes.lsfx:
        case FileTypes.lsfex:
        case FileTypes.lsb:
        case FileTypes.lsbc:
        case FileTypes.lsbs: {
          targetFile = path.join(this.name + "." + FileTypes[FileTypes.lsx]);
        }
        case FileTypes.loca: {
          targetFile = path.join(this.name + "." + FileTypes[FileTypes.xml]);
        }
      }
    }

    return targetFile;
  }
}
