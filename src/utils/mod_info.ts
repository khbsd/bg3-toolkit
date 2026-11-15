import * as fs from "fs";
import * as path from "path";

import { consoleWebviewLog } from "../webview/console";
import { getModPath } from "./file";
import { LsFile } from "./ls-formats/formats";
import { ModOptions } from "./templates/template";
import { getWorkspacePath } from "./ws";

export const ModuleInfoTag = '<node id="ModuleInfo">';
export const NameRegex: RegExp = new RegExp(
  /id="Name"\s+type="FixedString"\s+value="(?<name>[^"]*)"/,
  "g",
);
export const AuthorRegex: RegExp = new RegExp(
  /id="Author"\s+type="LSWString"\s+value="(?<author>[^"]*)"/,
  "g",
);
export const ModUuidRegex: RegExp = new RegExp(
  /id="UUID"\s+type="FixedString"\s+value="(?<modUuid>[^"]*)"/,
  "g",
);
export const IconUuidRegex: RegExp = new RegExp(
  /id="UUID"\s+type="FixedString"\s+value="(?<iconUuid>[^"]*)"/,
  "g",
);

export type ModIndicatorFile = {
  name: string;
  re: RegExp[];
  of: string;
};

export const indicatorFiles: ModIndicatorFile[] = [
  {
    name: "meta.lsx",
    re: [NameRegex, AuthorRegex, ModUuidRegex],
    of: "preexists",
  },
  {
    name: "Icons_Items.lsx",
    re: [IconUuidRegex],
    of: "items",
  },
  {
    name: path.join("[PAK]_UI", "_merged.lsx"),
    re: [IconUuidRegex],
    of: "items",
  },
  {
    name: "Config.json",
    re: [],
    of: "scripting",
  },
  {
    name: "BootstrapClient.lua",
    re: [],
    of: "scripting",
  },
  {
    name: "BootstrapServer.lua",
    re: [],
    of: "scripting",
  },
  {
    name: "[PAK]_Armor",
    re: [],
    of: "assets",
  },
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

export function getModIndicatorFile(name: string): LsFile | undefined {
  for (const entry of fs.readdirSync(getModPath(getWorkspacePath()), {
    recursive: true,
    withFileTypes: true,
  })) {
    let fpath: string = path.join(entry.parentPath, entry.name);
    if (fpath.toLowerCase().includes(name.toLowerCase())) {
      return new LsFile(fpath);
    }
  }
  return undefined;
}

export function getModIndicatorDir(name: string): boolean {
  let exists: boolean = false;
  for (const entry of fs.readdirSync(getModPath(getWorkspacePath()), {
    recursive: true,
    withFileTypes: true,
  })) {
    let fpath: string = path.join(entry.parentPath, entry.name);
    if (fpath.toLowerCase().includes(name.toLowerCase())) {
      exists = true;
      break;
    }
  }
  return exists;
}

export async function getModInfo(): Promise<ModOptions> {
  let opts = {
    name: "",
    author: "",
    modUuid: undefined,
    iconUuid: undefined,
    assets: undefined,
    items: undefined,
    scripting: undefined,
    preexists: undefined,
  };
  consoleWebviewLog("checking for existing mod files...");

  for (const indicator of indicatorFiles) {
    if (path.extname(indicator.name) === "") {
      const dirExists: boolean = getModIndicatorDir(indicator.name);

      consoleWebviewLog(indicator.name);
      consoleWebviewLog(indicator.name, "folder found, marking as", dirExists);

      Reflect.set(opts, indicator.of, dirExists);
      continue;
    }

    let file: LsFile | undefined = undefined;
    try {
      file = getModIndicatorFile(indicator.name);
    } catch (err) {
      consoleWebviewLog(err);
    }
    if (file === undefined) {
      consoleWebviewLog(indicator.name, "not found");

      // if file is undefined the opt must be set to false and not overwritten
      if (Reflect.get(opts, indicator.of) !== false) {
        consoleWebviewLog(
          indicator.of,
          "is missing or incomplete, marking as",
          file !== undefined,
        );
        Reflect.set(opts, indicator.of, file !== undefined);
      }
      continue;
    }

    consoleWebviewLog(file.name, "file found");

    const content: string = fs.readFileSync(file.path).toString();
    for (const re of indicator.re) {
      for (const result of content.matchAll(re)) {
        if (
          (hasMetaFile(file.path) &&
            !content.slice(0, result.index).includes(ModuleInfoTag)) ||
          result.groups === undefined
        ) {
          continue;
        }
        for (let opt of Object.keys(opts)) {
          let key = opt as keyof typeof opts;
          if (result.groups[key] === "") {
            consoleWebviewLog(key, "not found, marking as", undefined);
            Reflect.set(opts, key, undefined);
          } else if (result.groups[key] !== undefined) {
            consoleWebviewLog(key, "found, setting to", result.groups[key]);
            Reflect.set(opts, key, result.groups[key]);
          }
        }
      }
    }

    // if the indicator opt has not been set previously by the undefined guards,
    // set it to true
    if (Reflect.get(opts, indicator.of) === undefined) {
      consoleWebviewLog(indicator.of, "found, marking as", file !== undefined);
      Reflect.set(opts, indicator.of, file !== undefined);
    }
  }

  return opts as ModOptions;
}
