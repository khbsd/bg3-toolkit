import * as fs from "fs";
import * as path from "path";
import {
  FileFormats,
  LsfCompressionFormats,
  File,
  isEditable,
} from "./ls-formats/formats";
import { Config } from "./config";
import { FileHandle } from "fs/promises";

type xmlTagType = {
  expectedLine: number;
  expectedValue: string;
};

const xmlTags: xmlTagType[] = [
  { expectedLine: 1, expectedValue: '<?xml version="1.0" encoding="utf-8"?>' },
  { expectedLine: 2, expectedValue: "<contentlist>" },
  { expectedLine: -1, expectedValue: "</contentlist>" },
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

class getFilesOpts {
  type?: string;
  forConversion?: boolean;
  conf?: Config;
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
    for (const ignored of conf.conversionExcludePaths) {
      let fp: string = path.join(entry.parentPath, entry.name);
      let conversion: boolean = true;
      let unneeded: boolean = false;

      for (const dir of conf.conversionNeededDirectories) {
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
        if (opts?.forPacking) {
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

  console.log(file);

  file.readLines().on("line", (line) => {
    console.log(line);
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

// this can probably be simplified. needs boolean flags for each of the expected values instead of lines.
// each expectedValue needs to be found in order but not necessarily at exact lines.
export function mergeXmlLines(lines: string[]): string[] {
  const conf: Config = new Config();
  let mergedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    let dontPushValue: boolean = false;
    for (const tag of xmlTags) {
      if (
        (i === tag.expectedLine && line === tag.expectedValue) ||
        (i === lines.length - 1 &&
          tag.expectedLine === -1 &&
          tag.expectedValue === line)
      ) {
        mergedLines.push(lines[i]);
        if (line === xmlTags[0].expectedValue && mergedLines.length > 0) {
          mergedLines.reverse();
        }
        dontPushValue = true;
        // console.log("pushed " + lines[i] + " at " + i);
        break;
      } else {
        dontPushValue =
          (i === tag.expectedLine && line !== tag.expectedValue) ||
          (i !== tag.expectedLine && line === tag.expectedValue);
      }

      if (dontPushValue) {
        //console.log("not pushing " + lines[i] + " at " + i);
        break;
      }

      // console.log(!dontPushValue, i, tag, lines[i]);
    }
    if (!dontPushValue) {
      if (
        conf.mergedLocalizationAllowDuplicates &&
        mergedLines.includes(lines[i])
      ) {
        // console.log("pushed allowed duplicate " + lines[i] + " at " + i);
        mergedLines.push(lines[i]);
      } else if (line === "" && mergedLines.at(-1) !== line) {
        // console.log("pushing empty line");
        mergedLines.push(lines[i]);
      } else if (!mergedLines.includes(lines[i])) {
        mergedLines.push(lines[i]);
      }
    } else {
      // console.log("not pushing " + lines[i] + " at " + i);
    }

    // TODO: this function needs cleaning up i think
  }

  return mergedLines;
}
