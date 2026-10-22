import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { Config } from "./config";
import { getFiles, getLinesFromFileSync, getModPath } from "./file";
import { FileFormats } from "./ls-formats/formats";
import { getSelectionOrCursorWord, getWorkspacePath } from "./ws";
import { EOL } from "os";
import { consoleWebviewLog } from "../webview/console";

const enum XmlTag {
  VersionEncoding,
  Version,
  OpenContentList,
  OpenContentListv2,
  CloseContentList,
  OpenContent = 0,
  CloseContent = 1,
}

/**
 * keeping this here as documentation of the types of files the regex in XmlFileTags was used for
 */
const xmlFileTags: string[] = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<?xml version="1.0"?>',
  "<contentList>",
  '<contentList xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
  "</contentList>",
];

const xmlLineTags: string[] = [
  '<content contentuid="${handle}" version="1">',
  "</content>",
];

type Tag = {
  re: RegExp;
  text: string;
  name: string;
};

class XmlFileTags {
  version: Tag;
  openContentList: Tag;
  closeContentList: Tag;

  constructor() {
    this.version = {
      re: /(?<version><\?[\s\w\=\"\d\.\-]*\?>)/,
      text: xmlFileTags[XmlTag.VersionEncoding],
      name: "version",
    };
    this.openContentList = {
      re: /(?<openContentList><contentList[\w\s\:\=\"\.\/\-]*>)/,
      text: xmlFileTags[XmlTag.OpenContentList],
      name: "openContentList",
    };
    this.closeContentList = {
      re: /(?<closeContentList><\/contentList+>)/,
      text: xmlFileTags[XmlTag.CloseContentList],
      name: "closeContentList",
    };
  }
}

class XmlFile {
  name: string;
  path: string;
  tags: XmlFileTags;
  content: string[];
  strippedContent: string[] = [];

  constructor(filePath: string, addNameTag?: boolean) {
    this.path = filePath;
    this.name = path.basename(this.path);
    this.content = this.setUpContent(
      getLinesFromFileSync(this.path),
      addNameTag ?? false,
    );
    this.tags = this.getTags();
    this.strippedContent = stripOpeningClosingTags(this);
  }

  private setUpContent(content: string[], addNameTag: boolean): string[] {
    const conf: Config = new Config();
    let tmpContent: string[] = [];
    let fileString: string = "<!-- " + this.name + " --> ";
    if (
      !content.includes(fileString) &&
      !this.name.includes(conf.mergedLocalizationName) &&
      addNameTag
    ) {
      tmpContent.push(fileString);
      tmpContent.push("");
    }

    tmpContent = tmpContent.concat(content);
    return tmpContent;
  }

  private getTags(): XmlFileTags {
    let tags: XmlFileTags = new XmlFileTags();
    for (const line of this.content) {
      for (let tag of Object.keys(tags)) {
        let key = tag as keyof typeof tags;
        if (tags[key].text.length === 0) {
          let match = line.match(tags[key].re)?.groups;
          if (match !== undefined) {
            tags[key].text = match[key];
          }
        }
      }
    }
    return tags;
  }
}

export async function addHandleToXml(handle?: string, fileIndex?: number) {
  handle = handle ?? getSelectionOrCursorWord();

  let tabSize: number = 4;
  try {
    tabSize = Number(vscode.window.activeTextEditor?.options.tabSize);
  } catch (err) {
    console.log(err);
  }
  let tab = "";
  while (tab.length < tabSize) {
    tab += " ";
  }

  fileIndex = fileIndex ?? 0;

  const xmlFiles: XmlFile[] = [];
  getFiles(getWorkspacePath(), {
    type: FileFormats.xml,
  }).forEach((file) => {
    xmlFiles.push(new XmlFile(file.path));
  });

  let xmlFile: XmlFile | undefined = undefined;

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
    handle =
      tab +
      xmlLineTags[XmlTag.OpenContent].replace("${handle}", handle) +
      xmlLineTags[XmlTag.CloseContent];

    xmlFile.strippedContent.push(handle);
    xmlFile.content = addOpeningClosingTags(
      xmlFile.strippedContent,
      xmlFile.tags,
    );

    fs.writeFile(
      xmlFile.path,
      xmlFile.content.join(EOL),
      { flag: "w" },
      (err) => {
        if (err) {
          consoleWebviewLog(err);
          return;
        }
        consoleWebviewLog(xmlFile?.path, "saved");
      },
    );
  }
}

export function stripOpeningClosingTags(file: XmlFile): string[] {
  let linesToDelete: number[] = [];
  let lines = file.content;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();

    for (const tag of Object.values(file.tags)) {
      const tagLower = tag.text.toLowerCase();
      if (line.includes(tagLower)) {
        if (line.toLowerCase() !== tagLower) {
          let tmpLine = lines[i].replace(tagLower, "");
          if (tmpLine === lines[i]) {
            tmpLine = lines[i].replace(tag.text, "");
          }
          lines[i] = tmpLine;
        } else {
          linesToDelete.push(i);
        }
      }
    }
  }

  for (const line of linesToDelete.toReversed()) {
    lines.splice(line, 1);
  }
  return lines;
}

export function addOpeningClosingTags(
  lines: string[],
  tags: XmlFileTags,
): string[] {
  lines = [tags.version.text, tags.openContentList.text].concat(lines);
  lines.push(tags.closeContentList.text);
  return lines;
}

export function mergeXmlFiles(wsPath: string): boolean {
  const conf = new Config();
  wsPath = getModPath(wsPath);
  if (conf.mergedLocalizationName.length < 1) {
    return false;
  }
  // cant merge a single file
  else if (fs.statSync(wsPath).isFile()) {
    return false;
  }

  let lines: string[] = [];
  let files: XmlFile[] = [];
  getFiles(wsPath, {
    type: FileFormats.xml,
    forXmlMerging: true,
  }).forEach((file) => {
    files.push(new XmlFile(file.path, true));
  });

  // still cant merge a single file
  if (files.length < 2) {
    return false;
  }

  files.forEach((file) => {
    lines = lines.concat(file.content);
  });
  lines = mergeXmlLines(files);

  let text = lines.join(EOL);
  let locaPath = path.join(
    path.dirname(files[0].path),
    conf.mergedLocalizationName + "." + FileFormats[FileFormats.xml],
  );
  fs.writeFileSync(locaPath, text, { flag: "w+" });
  return true;
}

export function mergeXmlLines(files: XmlFile[]): string[] {
  const conf: Config = new Config();
  let mergedLines: string[] = [];

  const openingTags: XmlFileTags = files[0].tags;
  let lines: string[] = [];
  for (const file of files) {
    lines = lines.concat(file.strippedContent);
  }

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

  return addOpeningClosingTags(mergedLines, openingTags);
}
