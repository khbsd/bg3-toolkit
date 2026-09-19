import * as fs from "fs";
import * as path from "path";
import * as eutils from "../enum";
import * as futils from "../file";
import * as lsPak from "larian-formats-wasm";
import { Config } from "../config";

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

export function getCompressionType(ext: string): CompressionType {
  switch (FileFormats[ext as keyof typeof FileFormats]) {
    case FileFormats.xml:
    case FileFormats.loca: {
      return CompressionType.loca;
    }
    default:
      return CompressionType.lsf;
  }
}

export class File {
  name: string;
  path: string;
  parent: string;
  compressionType: CompressionType;
  ext: string;
  out_path: string;
  out_ext: string;
  constructor(fp: string) {
    this.name = path.basename(fp, path.extname(fp));
    this.ext = path.extname(fp).slice(1);
    this.parent = fp.slice(this.name.length);
    this.path = fp;
    this.compressionType = getCompressionType(this.ext);
    this.out_path = path.resolve(this.path, "..", this.toExt());
    this.out_ext = path.extname(this.out_path).slice(1);
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

class ConvertCommonOpts {
  type?: FileFormats;
  modPath?: string;
  conf?: Config;
}

/**
 * THIS CLASS SHOULD ONLY BE EXTENDED, NOT INSTANTIATED.
 */
export class ConvertCommon {
  builder;
  wsPath: string;
  modPath: string;
  files: File[] = [];
  type: FileFormats;
  conf: Config;

  /**
   * placeholder for format specific file conversion funcs.
   */
  protected _cf = (f: File) => {
    return;
  };
  /**
   * @param wsPath string
   * @param type FileFormats
   * @param modPath string | undefined
   *
   * if you pass a single file instead of a folder for the 'wsPath' parameter,
   * this class will assume you are converting a single file and skip populating
   * the 'files' array.
   */
  constructor(wsPath: string, opts?: ConvertCommonOpts) {
    this.builder = lsPak;
    this.type = opts?.type ?? FileFormats.lsx;
    this.wsPath = futils.fixPath(wsPath);
    this.modPath = opts?.modPath ?? futils.getModPath(this.wsPath);
    this.conf = opts?.conf ?? new Config();
    if (fs.statSync(this.wsPath).isDirectory()) {
      if (this.type === FileFormats.pak) {
        this.files = futils.getFiles(this.modPath, {
          forPacking: this.conf.doNotPackEditables,
        });
      } else {
        this.files = futils.getFiles(this.modPath, {
          type: FileFormats[this.type],
          forConversion: true,
        });
      }
    }
  }

  /**
   * make sure you have assigned 'this._cf' in your extended class before calling this function.
   */
  public convertModDir() {
    for (let f of this.files) {
      this._cf(f);
    }
  }
}
