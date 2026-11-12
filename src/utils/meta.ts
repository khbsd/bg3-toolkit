import * as fs from "fs";
import * as path from "path";

import { getModPath } from "./file";
import { LsFile } from "./ls-formats/formats";
import { ModOptions } from "./templates/template";
import { getWorkspacePath } from "./ws";

export const ModuleInfoTag = '<node id="ModuleInfo">';
export const MetaNameRegex: RegExp = new RegExp(
  /id="Name"\s+type="FixedString"\s+value="(?<name>[^"]*)"/,
  "g",
);
export const MetaAuthorRegex: RegExp = new RegExp(
  /id="Author"\s+type="LSWString"\s+value="(?<author>[^"]*)/,
  "g",
);
export const MetaUuidRegex: RegExp = new RegExp(
  /id="UUID"\s+type="FixedString"\s+value="(?<modUuid>[^"]*)/,
  "g",
);

export const MetaRegex: RegExp[] = [
  MetaNameRegex,
  MetaAuthorRegex,
  MetaUuidRegex,
];

export function hasMetaFile(path: string): boolean {
  return path.toLowerCase().includes("meta.lsx");
}

export function getMetaFile(): LsFile | undefined {
  for (const entry of fs.readdirSync(getModPath(getWorkspacePath()), {
    recursive: true,
    withFileTypes: true,
  })) {
    let fpath: string = path.join(entry.parentPath, entry.name);
    if (hasMetaFile(fpath)) {
      return new LsFile(fpath);
    }
  }
  return undefined;
}

export function getModInfoFromMeta(file?: LsFile): ModOptions {
  file = file ?? getMetaFile();

  let opts = { name: "", author: "", modUuid: "" };
  if (file === undefined) {
    return opts;
  }

  let content: string = fs.readFileSync(file.path).toString();
  for (const re of MetaRegex) {
    for (const result of content.matchAll(re)) {
      if (result.groups === undefined) {
        continue;
      }
      if (!content.slice(0, result.index).includes(ModuleInfoTag)) {
        continue;
      }
      for (let opt of Object.keys(opts)) {
        let key = opt as keyof typeof opts;
        if (result.groups[key] !== undefined) {
          opts[key] = result.groups[key];
        }
      }
      console.log(opts);
    }
  }

  return opts as ModOptions;
}
