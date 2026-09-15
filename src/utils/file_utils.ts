import * as fs from "fs";
import * as path from "path";

const pakIgnorePaths: string[] = [
  ".git",
  ".pak",
  ".vscode",
  ".bak",
  ".zip",
  "meta.lsx",
  "Icons_Items.lsx",
];

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

export function getModPath(wsPath: string): string {
  let wsPaths = fs.readdirSync(fixPath(wsPath), {
    recursive: true,
    withFileTypes: true,
  });
  for (let p of wsPaths) {
    if (!p.isFile()) {
      continue;
    }
    if (p.name.toLowerCase().includes("meta.lsx")) {
      return path.resolve(p.parentPath, "..", "..");
    }
  }
  return "";
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
  let fType: string = "." + (type ?? "");

  wsPath = fixPath(wsPath);
  let dirents = fs.readdirSync(wsPath, {
    recursive: true,
    withFileTypes: true,
  });

  for (let entry of dirents) {
    let pathOk: boolean = true;
    let filter: boolean = true;

    if (fType.length > 1) {
      filter = entry.name.includes(fType);
    }

    for (let i of pakIgnorePaths) {
      let p: string = path.join(entry.parentPath, entry.name);
      let conversion: boolean = true;

      for (let dir of fileConvertDirs) {
        if (forConversion) {
          conversion = entry.parentPath.includes(dir);
        }
        if (conversion) {
          break;
        }
      }
      pathOk =
        conversion &&
        !p.includes(i) &&
        entry.isFile() &&
        !entry.name.startsWith(".") &&
        filter;
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
