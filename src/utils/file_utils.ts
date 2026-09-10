import * as fs from "fs";
import * as path from "path";

const ignorePaths = [".git", ".pak", ".vscode"];

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
    if (p.name.toLowerCase().includes("meta.lsx")) {
      return path.resolve(p.parentPath, "..", "..");
    }
  }
  return "";
}

export function isModPath(path: string): boolean {
  let hasMetaLsx: boolean = false;
  let files = fs.readdirSync(path);

  for (let file in files) {
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

export function getFiles(wsPath: string): fs.Dirent[] {
  let paths: fs.Dirent[] = [];

  wsPath = fixPath(wsPath);
  let dirents = fs.readdirSync(wsPath, {
    recursive: true,
    withFileTypes: true,
  });

  for (let entry of dirents) {
    let pathOk: boolean = true;
    for (let i of ignorePaths) {
      pathOk =
        !entry.parentPath.includes(i) &&
        !entry.name.includes(i) &&
        entry.name !== i &&
        entry.isFile();

      if (!pathOk) {
        break;
      }
    }

    if (pathOk) {
      paths.push(entry);
    }
  }

  return paths;
}
