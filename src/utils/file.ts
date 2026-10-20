import * as fs from "fs";
import * as path from "path";

import { FileHandle } from "fs/promises";
import { consoleWebviewLog } from "../webview/console";
import { Config } from "./config";
import {
  FileFormats,
  LsFile,
  LsfCompressionFormats,
  isEditable,
  isLoca,
} from "./ls-formats/formats";
import { getWorkspacePath } from "./ws";

const virtualTextureRegex: RegExp = /Textures_[\d]+/;
const hotfixPatchRegex: RegExp = /Patch[\d]+_Hotfix[\d]+/;

const enum XmlTag {
  VersionEncoding,
  Version,
  OpenContentList,
  OpenContentListv2,
  CloseContentList,
  OpenContent = 0,
  CloseContent = 1,
}


export function fixPath(wsPath: string): string {
  const illegal_strings = ["file:", "//"];
  for (let str of illegal_strings) {
    if (wsPath.includes(str)) {
      wsPath = wsPath.replace(str, "");
    }
  }

  return wsPath;
}

export function getRelativeModPath(modPath: string, fullPath: string): string {
  // aw yeah the good ole split slice split :^ )
  let relPath = fullPath.split(path.sep).slice(modPath.split(path.sep).length);

  let relativePath = "";
  relPath.forEach((d) => {
    relativePath = path.join(relativePath, d);
  });
  return relativePath;
}

/**
 * find mod root path from a path within your mod. can be a file or a directory.
 * @param wsPath string
 * @returns string
 */
export function getModPath(wsPath: string): string {
  wsPath = fixPath(wsPath);

  let tempPath: string = wsPath;
  let retPath: string = "";
  if (fs.statSync(tempPath).isFile()) {
    tempPath = path.resolve(wsPath, "..");
  }
  let wsPaths = fs.readdirSync(tempPath, {
    recursive: true,
    withFileTypes: true,
  });

  for (let p of wsPaths) {
    if (!p.isFile()) {
      continue;
    }
    if (hasMetaFile(p.name)) {
      retPath = path.resolve(p.parentPath, "..", "..");
    }
  }
  if (retPath.length === 0) {
    return getModPath(path.resolve(tempPath, ".."));
  }
  return retPath;
}

export function hasMetaFile(path: string): boolean {
  return path.toLowerCase().includes("meta.lsx");
}

export function getMetaFile(): LsFile | undefined {
  for (const entry of fs.readdirSync(getModPath(getWorkspacePath()), { recursive: true, withFileTypes: true })) {
    let fpath: string = path.join(entry.parentPath, entry.name);
    if (hasMetaFile(fpath)) {
      return new LsFile(fpath);
    }
  }
  return undefined;
}

export function getModName(modPath: string): string {
  consoleWebviewLog("getting mod name from mod path: " + modPath);
  consoleWebviewLog(modPath.split(path.sep).at(-1));
  return modPath.split(path.sep).at(-1) ?? "";
}


export function mergedLocaExists(
  dirents: fs.Dirent[],
  mergedLocaName: string,
): boolean {
  let mergedExists: boolean = false;

  for (const entry of dirents) {
    if (isLoca(entry.name)) {
      mergedExists = entry.name.split(".")[0] === mergedLocaName;
      if (mergedExists) {
        return true;
      }
    }
  }
  return mergedExists;
}


function filterLocalizations(dirents: fs.Dirent[]): fs.Dirent[] {
  const conf = new Config();

  let mergedExists: boolean = mergedLocaExists(
    dirents,
    conf.mergedLocalizationName,
  );
  let filteredDirs: fs.Dirent[] = [];

  for (const entry of dirents) {
    if (isLoca(entry.name)) {
      if (mergedExists) {
        if (entry.name.split(".")[0] === conf.mergedLocalizationName) {
          filteredDirs.push(entry);
        }
      } else {
        filteredDirs.push(entry);
      }
    } else {
      filteredDirs.push(entry);
    }
  }

  return filteredDirs;
}

/**
 * @param type: string | undefined
 */
export type getFilesOpts = {
  type?: FileFormats;
  forConversion?: boolean;
  conf?: Config;
  forRemovingEditables?: boolean;
  forXmlMerging?: boolean;
  forPacking?: boolean;
  forUnpackingGameFiles?: boolean;
};

export function getFiles(wsPath: string, opts?: getFilesOpts): LsFile[] {
  let files: LsFile[] = [];
  let type: string = "";
  let conf = opts?.conf ?? new Config();
  if (opts?.type !== undefined) {
    type = FileFormats[opts.type];
  }

  wsPath = fixPath(wsPath);

  let dirents = fs.readdirSync(wsPath, {
    recursive: true,
    withFileTypes: true,
  });

  if (conf.mergedLocalizationName.length > 0 && opts?.forPacking) {
    consoleWebviewLog("removing non-merged loca files");
    dirents = filterLocalizations(dirents);
  }

  function pushToFiles(entry: fs.Dirent) {
    files.push(new LsFile(path.join(entry.parentPath, entry.name)));
    consoleWebviewLog("added", entry.name);
  }

  for (let entry of dirents) {
    let pathOk: boolean = true;
    let filter: boolean = true;

    // filter out specified file formats by provided extension
    if (type.length > 0 && type !== FileFormats[FileFormats.none]) {
      if (type === FileFormats[FileFormats.lsf]) {
        for (const t of LsfCompressionFormats) {
          filter = entry.name.includes("." + FileFormats[t]);
          if (filter) {
            break;
          }
        }
      } else {
        filter = entry.name.includes("." + type);

        // unpacking game data
        if (opts?.forUnpackingGameFiles && filter) {
          if (!hotfixPatchRegex.test(entry.name) && !virtualTextureRegex.test(entry.name)) {
            pushToFiles(entry);
            continue;
          }
        }
      }
    }

    // ignore paths or files that dont need converting
    for (const ignored of conf.conversionExcludePaths) {
      let fp: string = path.join(entry.parentPath, entry.name);
      let conversion: boolean = true;
      let unneeded: boolean = false;

      for (const dir of conf.conversionNeededDirectories) {
        const fileOk: boolean = entry.parentPath.includes(dir) &&
          !conf.conversionExcludeFiles.includes(
            path.basename(entry.name, path.extname(entry.name)),
          );

        if (opts?.forXmlMerging) {
          unneeded =
            entry.name.split(".")[0] === conf.mergedLocalizationName &&
            isLoca(entry.name);

          if (unneeded) {
            break;
          }
        }

        if (opts?.forConversion) {
          conversion = fileOk;

          if (conversion) {
            break;
          }
        }

        // lets you omit editable files from the .pak that the game wont look for
        if (opts?.forRemovingEditables) {
          const f = new LsFile(fp);
          unneeded = isEditable(f.ext) && fileOk;

          if (unneeded) {
            break;
          }
        }
      }

      pathOk =
        conversion &&
        !unneeded &&
        filter &&
        !fp.includes(ignored) &&
        entry.isFile() &&
        !entry.name.startsWith(".");
      if (!pathOk) {
        break;
      }
    }

    if (pathOk) {
      pushToFiles(entry);
    }
  }

  return files;
}

export async function getLinesFromFile(filePath: string): Promise<string[]> {
  let lines: string[] = [];
  let file: FileHandle = await fs.promises.open(filePath);

  file.readLines().on("line", (line) => {
    lines.push(line);
  });

  return lines;
}

export function getLinesFromFileSync(filePath: string): string[] {
  const text: string = fs.readFileSync(filePath, "utf-8");
  let lines: string[] = text.split("\r\n");

  // length of 1 means nothing was split
  if (lines.length === 1) {
    consoleWebviewLog("trying unix newlines");
    lines = text.split("\n");
  }

  return lines;
}
