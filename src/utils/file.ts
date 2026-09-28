import * as fs from "fs";
import * as path from "path";
import {
  FileFormats,
  LsfCompressionFormats,
  File,
  isEditable,
  isLoca,
} from "./ls-formats/formats";
import { Config } from "./config";
import { FileHandle } from "fs/promises";
import { EOL } from "os";

type xmlTagType = {
  linePresent: boolean;
  expectedValue: string;
};

const xmlTags: xmlTagType[] = [
  {
    linePresent: false,
    expectedValue: '<?xml version="1.0" encoding="utf-8"?>',
  },
  { linePresent: false, expectedValue: "<contentlist>" },
  { linePresent: false, expectedValue: "</contentlist>" },
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

export function mergeXmlFiles(wsPath: string): boolean {
  const conf = new Config();
  if (conf.mergedLocalizationName.length < 1) {
    return false;
  }

  let lines: string[] = [];
  let files = getFiles(wsPath, {
    type: FileFormats[FileFormats.xml],
    forXmlMerging: true,
  });
  files.forEach((file) => {
    lines.push("<!--" + file.name + "." + file.ext + "-->");
    lines = lines.concat(getLinesFromFileSync(file.path));
  });
  lines = mergeXmlLines(lines);

  let text = lines.join(EOL);
  let locaPath = path.join(
    path.dirname(files[0].path),
    conf.mergedLocalizationName + "." + FileFormats[FileFormats.xml],
  );
  fs.writeFileSync(locaPath, text, { flag: "w+" });
  return true;
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

class getFilesOpts {
  type?: string;
  forConversion?: boolean;
  conf?: Config;
  forRemovingEditables?: boolean;
  forXmlMerging?: boolean;
  forPacking?: boolean;
}

export function getFiles(wsPath: string, opts?: getFilesOpts): File[] {
  let files: File[] = [];
  let type = opts?.type ?? "";
  let conf = opts?.conf ?? new Config();

  console.log(conf);
  wsPath = fixPath(wsPath);

  let dirents = fs.readdirSync(wsPath, {
    recursive: true,
    withFileTypes: true,
  });

  if (conf.mergedLocalizationName.length > 0 && opts?.forPacking) {
    console.log("removing non-merged loca files");
    dirents = filterLocalizations(dirents);
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
      }
    }

    // ignore paths or files that dont need converting
    for (const ignored of conf.conversionExcludePaths) {
      let fp: string = path.join(entry.parentPath, entry.name);
      let conversion: boolean = true;
      let unneeded: boolean = false;

      for (const dir of conf.conversionNeededDirectories) {
        if (opts?.forXmlMerging) {
          unneeded =
            entry.name.split(".")[0] === conf.mergedLocalizationName &&
            isLoca(entry.name);

          if (unneeded) {
            break;
          }
        }

        if (opts?.forConversion) {
          conversion =
            entry.parentPath.includes(dir) &&
            !conf.conversionExcludeFiles.includes(
              path.basename(entry.name, path.extname(entry.name)),
            );

          if (conversion) {
            break;
          }
        }

        // lets you omit editable files from the .pak that the game wont look for
        if (opts?.forRemovingEditables) {
          const f = new File(fp);
          unneeded =
            isEditable(f.ext) &&
            entry.parentPath.includes(dir) &&
            !conf.conversionExcludeFiles.includes(
              path.basename(entry.name, path.extname(entry.name)),
            );

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
      files.push(new File(path.join(entry.parentPath, entry.name)));
      console.log("added", entry.name);
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
    console.log("trying unix newlines");
    lines = text.split("\n");
  }

  return lines;
}

// needs more testing, copy one line in each of the xml file dupes and change it to make sure differences are caught
export function mergeXmlLines(lines: string[]): string[] {
  const conf: Config = new Config();

  let tags = xmlTags;

  let mergedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    let dontPushValue: boolean = false;

    for (let tag of tags) {
      if (dontPushValue) {
        break;
      }

      if (tag.expectedValue !== xmlTags.at(-1)?.expectedValue) {
        tag.linePresent = dontPushValue =
          tag.expectedValue === line && mergedLines.includes(lines[i]);
      } else {
        tag.linePresent = dontPushValue =
          tag.expectedValue === line &&
          !mergedLines.includes(lines[i]) &&
          i !== lines.length - 1;
      }
    }

    if (dontPushValue) {
      continue;
    }

    if (
      (conf.mergedLocalizationAllowDuplicates &&
        mergedLines.includes(lines[i])) ||
      !mergedLines.includes(lines[i]) ||
      (line === "" && mergedLines.at(-1) !== line)
    ) {
      mergedLines.push(lines[i]);
    }
  }

  return mergedLines;
}
