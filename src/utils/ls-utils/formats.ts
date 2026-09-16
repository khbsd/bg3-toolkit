import * as fs from "fs";
import * as path from "path";
import * as eutils from "../enum_utils";
import * as futils from "../file_utils";
import * as lsPak from "larian-formats-wasm";
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

export const LsfCompressionFormats: FileFormats[] = [
  FileFormats.lsf,
  FileFormats.lsfx,
  FileFormats.lsfex,
  FileFormats.lsb,
  FileFormats.lsbc,
  FileFormats.lsbs,
];

export const EditableFormats: FileFormats[] = [
  FileFormats.lsx,
  FileFormats.xml,
];

// should be distinct from the FileFormats type
export enum CompressionType {
  lsf,
  loca,
  count,
}

export function isEditable(ext: string): boolean {
  if (ext.startsWith(".")) {
    ext = ext.slice(1);
  }

  return EditableFormats.includes(FileFormats[ext as keyof typeof FileFormats]);
}

export class File {
  name: string;
  path: string;
  compressionType: CompressionType;
  ext: string;
  out_path: string;
  out_ext: string;
  constructor(fp: string) {
    this.name = path.basename(fp, path.extname(fp));
    this.ext = path.extname(fp).slice(1);
    this.path = fp;
    this.compressionType = this.getCompressionType();
    this.out_path = path.resolve(this.path, "..", this.toExt());
    this.out_ext = path.extname(this.out_path).slice(1);
  }

  public getCompressionType(): CompressionType {
    switch (FileFormats[this.ext as keyof typeof FileFormats]) {
      case FileFormats.xml:
      case FileFormats.loca: {
        return CompressionType.loca;
      }
      default:
        return CompressionType.lsf;
    }
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
          break;
        }
        case FileFormats.xml: {
          targetFile = path.join(
            this.name + "." + FileFormats[FileFormats.loca],
          );
          break;
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
          break;
        }
        case FileFormats.loca: {
          targetFile = path.join(
            this.name + "." + FileFormats[FileFormats.xml],
          );
          break;
        }
      }
    }

    return targetFile;
  }
}

/**
 * THIS CLASS SHOULD ONLY BE EXTENDED, NOT INSTANTIATED.
 */
export class ConvertCommon {
  builder;
  wsPath: string;
  modPath: string;
  paths: fs.Dirent[];
  type: FileFormats;

  /**
   * placeholder for format specific file conversion funcs.
   */
  protected _cf = (f: File) => {
    return;
  };
  constructor(wsPath: string, type: FileFormats, modPath?: string | undefined) {
    this.builder = lsPak;
    this.type = type;
    this.wsPath = futils.fixPath(wsPath);
    this.modPath = modPath ?? futils.getModPath(this.wsPath);
    this.paths = futils.getFiles(this.modPath, FileFormats[this.type], true);
  }

  /**
   * make sure you have assigned 'this._cf' in your extended class before calling this function.
   */
  public convertModDir() {
    for (let p of this.paths) {
      const fullPath: string = path.join(p.parentPath, p.name);
      this._cf(new File(fullPath));
    }
  }
}
