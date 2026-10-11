import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { FileHandle } from "fs/promises";
import { EOL } from "os";
import { consoleWebviewLog } from "../webview/console_webview";
import { Config } from "./config";
import {
  File,
  FileFormats,
  isEditable,
  isLoca,
  LsfCompressionFormats,
} from "./ls-formats/formats";
import { getSelectionOrCursorWord, getWorkspacePath } from "./ws";

const enum XmlTag {
  VersionEncoding,
  OpenContentList,
  CloseContentList,
  OpenContent = 0,
  CloseContent = 1,
}

const xmlFileTags: string[] = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  "<contentList>",
  "</contentList>",
];

const xmlLineTags: string[] = [
  '<content contentuid="${handle}" version="1">',
  "</content>",
];

const virtualTextureRegex: RegExp = /Textures_[\d]+/;
const hotfixPatchRegex: RegExp = /Patch[\d]+_Hotfix[\d]+/;

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

// maybe unneeded tbh
export function hasMetaFile(path: string): boolean {
  return path.toLowerCase().includes("meta.lsx");
}

export function getModName(modPath: string): string {
  consoleWebviewLog("getting mod name from mod path: " + modPath);
  consoleWebviewLog(modPath.split(path.sep).at(-1));
  return modPath.split(path.sep).at(-1) ?? "";
}

export async function addHandleToXml(handle?: string, fileIndex?: number) {
  handle = handle ?? getSelectionOrCursorWord();
  handle =
    "    " +
    xmlLineTags[XmlTag.OpenContent].replace("${handle}", handle) +
    xmlLineTags[XmlTag.CloseContent];
  fileIndex = fileIndex ?? 0;

  const xmlFiles: File[] = getFiles(getWorkspacePath(), {
    type: FileFormats.xml,
  });

  let xmlFile: File | undefined = undefined;

  switch (xmlFiles.length) {
    case 0: {
      await vscode.window.showErrorMessage("You have no localization files.");
      return;
    }
    case 1: {
      xmlFile = xmlFiles[fileIndex];
      break;
    }
    default: {
      const names: string[] = [];
      xmlFiles.forEach((file) => {
        names.push(file.name);
      });
      let picked =
        (await vscode.window.showQuickPick(names)) ?? names[fileIndex];

      xmlFiles.forEach((file) => {
        if (path.basename(file.name) === picked) {
          xmlFile = file;
        }
      });
      break;
    }
  }

  if (xmlFile !== undefined) {
    let lines = stripOpeningClosingTags(getLinesFromFileSync(xmlFile.path));
    lines.push(handle);
    lines = addOpeningClosingTags(lines);

    fs.writeFile(xmlFile.path, lines.join(EOL), { flag: "w" }, (err) => {
      if (err) {
        consoleWebviewLog(err);
        return;
      }
      consoleWebviewLog(xmlFile?.path + "saved");
    });
  }
}

export function stripOpeningClosingTags(lines: string[]): string[] {
  let linesToDelete: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();

    for (const tag of xmlFileTags) {
      const tagLower = tag.toLowerCase();
      if (line.includes(tagLower)) {
        if (line.toLowerCase() !== tagLower) {
          let tmpLine = lines[i].replace(tagLower, "");
          if (tmpLine === lines[i]) {
            tmpLine = lines[i].replace(tag, "");
          }
          lines[i] = tmpLine;
        } else {
          linesToDelete.push(i);
        }
      }
    }
  }

  for (const line of linesToDelete.toReversed()) {
    consoleWebviewLog("removing line " + line + lines[line]);
    lines.splice(line, 1);
  }

  return lines;
}

export function addOpeningClosingTags(lines: string[]): string[] {
  let openingTags: string[] = [
    xmlFileTags[XmlTag.VersionEncoding],
    xmlFileTags[XmlTag.OpenContentList],
  ];
  let closingTag: string[] = [
    xmlFileTags[XmlTag.CloseContentList],
  ];
  return openingTags.concat(lines).concat(closingTag);
}

export function mergeXmlFiles(wsPath: string): boolean {
  const conf = new Config();
  if (conf.mergedLocalizationName.length < 1) {
    return false;
  }
  // cant merge a single file
  else if (fs.statSync(wsPath).isFile()) {
    return false;
  }

  let lines: string[] = [];
  let files = getFiles(wsPath, {
    type: FileFormats.xml,
    forXmlMerging: true,
  });

  // still cant merge a single file
  if (files.length < 2) {
    return false;
  }

  files.forEach((file) => {
    lines.push("<!--" + file.name + "." + file.ext + "-->");
    lines.push("");
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

export function mergeXmlLines(lines: string[]): string[] {
  const conf: Config = new Config();
  let mergedLines: string[] = [];

  lines = stripOpeningClosingTags(lines);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      !mergedLines.includes(lines[i]) ||
      conf.mergedLocalizationAllowDuplicates ||
      (line === "" && mergedLines.at(-1) !== line) ||
      line.includes("<!--")
    ) {
      mergedLines.push(lines[i]);
    }
  }

  mergedLines = addOpeningClosingTags(mergedLines);
  return mergedLines;
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

export function getFiles(wsPath: string, opts?: getFilesOpts): File[] {
  let files: File[] = [];
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
    files.push(new File(path.join(entry.parentPath, entry.name)));
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

    console.log(entry.name);
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
