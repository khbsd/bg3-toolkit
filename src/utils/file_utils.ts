import * as fs from "fs";
import * as path from "path";
import { FileFormats, LsfCompressionFormats } from "./ls-utils/formats";

const pakIgnorePaths: string[] = [".git", ".pak", ".vscode", ".bak", ".zip"];

const convertIgnoreFiles: string[] = ["meta.lsx", "Icons_Items"];

const fileConvertDirs: string[] = [
  "[PAK]_UI",
  "[PAK]_Armor",
  "[PAK]_GeneratedDialogTimelines",
  "Assets",
  "Content",
  "Effects",
  "Flags",
  "LevelMapValues",
  "Localization",
  "MultiEffectInfos",
  "RootTemplates",
  "Timeline",
  "UI",
];

export function fixPath(wsPath: string): string {
  const illegal_strings = ["file:"];
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
  let tempPath: string = fixPath(wsPath);
  let retPath: string = "";
  if (fs.statSync(tempPath).isFile()) {
    tempPath = path.resolve(wsPath, "..");
  }
  let wsPaths = fs.readdirSync(tempPath, {
    recursive: true,
    withFileTypes: true,
  });
  console.log(wsPaths);
  for (let p of wsPaths) {
    if (!p.isFile()) {
      continue;
    }
    if (p.name.toLowerCase().includes("meta.lsx")) {
      retPath = path.resolve(p.parentPath, "..", "..");
    }
  }
  if (retPath.length === 0) {
    return getModPath(path.resolve(tempPath, ".."));
  }
  return retPath;
}

// maybe unneeded tbh
export function isModPath(path: string): boolean {
  let hasMetaLsx: boolean = false;
  let files = fs.readdirSync(path);

  for (let file in files) {
    console.log(file);
    hasMetaLsx = file.toLowerCase().includes("meta.lsx");
    if (hasMetaLsx) {
      break;
    }
  }

  return hasMetaLsx;
}

export function getModName(modPath: string): string {
  console.log("getting mod name from mod path: ", modPath);
  console.log(modPath.split(path.sep).at(-1));
  return modPath.split(path.sep).at(-1) ?? "";
}

export function getFiles(
  wsPath: string,
  type?: string,
  forConversion?: boolean,
): fs.Dirent[] {
  let paths: fs.Dirent[] = [];
  type = type ?? "";

  wsPath = fixPath(wsPath);
  let dirents = fs.readdirSync(wsPath, {
    recursive: true,
    withFileTypes: true,
  });

  for (let entry of dirents) {
    let pathOk: boolean = true;
    let filter: boolean = true;

    // filter out specified file formats by provided extension
    if (type.length > 0) {
      if (type === FileFormats[FileFormats.lsf]) {
        for (const t of LsfCompressionFormats) {
          filter = entry.name.includes("." + FileFormats[t]);
          if (filter) {
            break;
          }
        }
      } else {
        filter = entry.name.includes("." + type);
      }
    }

    // ignore paths or files that dont need converting
    for (let i of pakIgnorePaths) {
      let p: string = path.join(entry.parentPath, entry.name);
      let conversion: boolean = true;

      for (let dir of fileConvertDirs) {
        if (forConversion) {
          conversion =
            entry.parentPath.includes(dir) &&
            !convertIgnoreFiles.includes(
              path.basename(entry.name, path.extname(entry.name)),
            );
        }
        if (conversion) {
          break;
        }
      }
      pathOk =
        conversion &&
        filter &&
        !p.includes(i) &&
        entry.isFile() &&
        !entry.name.startsWith(".");
      if (!pathOk) {
        break;
      }
    }

    if (pathOk) {
      paths.push(entry);
      console.log("added", entry);
    }
  }

  return paths;
}
