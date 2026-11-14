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

export type Indicator = {
  of: string;
  extant: boolean;
};

export type ModIndicatorFile = {
  name: string;
  re: RegExp[];
  ind: Indicator;
};

export const indicatorFiles: ModIndicatorFile[] = [
  {
    name: "meta.lsx",
    re: [NameRegex, AuthorRegex, ModUuidRegex],
    ind: { of: "preexists", extant: false },
  },
  {
    name: "Icons_Items.lsx",
    re: [IconUuidRegex],
    ind: { of: "items", extant: false },
  },
  {
    name: path.join("[PAK]_UI", "_merged.lsx"),
    re: [IconUuidRegex],
    ind: { of: "items", extant: false },
  },
  {
    name: "Config.json",
    re: [],
    ind: { of: "scripting", extant: false },
  },
  {
    name: "[PAK]_Armor",
    re: [],
    ind: { of: "assets", extant: false },
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

  for (const indicator of indicatorFiles) {
    if (path.extname(indicator.name) === "") {
      consoleWebviewLog(indicator.name);
      consoleWebviewLog(
        "setting",
        indicator.ind.of,
        "to",
        getModIndicatorDir(indicator.name),
      );
      Reflect.set(opts, indicator.ind.of, getModIndicatorDir(indicator.name));
      continue;
    }

    let file: LsFile | undefined = undefined;
    try {
      file = getModIndicatorFile(indicator.name);
    } catch (err) {
      consoleWebviewLog(err);
    }
    if (file === undefined) {
      consoleWebviewLog(indicator.name, "not found, skipping");
      if (Reflect.get(opts, indicator.ind.of) !== false) {
        consoleWebviewLog(
          "setting",
          indicator.ind.of,
          "to",
          file !== undefined,
        );
        Reflect.set(opts, indicator.ind.of, file !== undefined);
      }
      continue;
    }

    consoleWebviewLog(file.name);

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
            consoleWebviewLog("setting", key, "to", undefined);
            Reflect.set(opts, key, undefined);
          } else if (result.groups[key] !== undefined) {
            consoleWebviewLog("setting", key, "to", result.groups[key]);
            Reflect.set(opts, key, result.groups[key]);
          }
        }
      }
    }
    if (Reflect.get(opts, indicator.ind.of) === undefined) {
      consoleWebviewLog("setting", indicator.ind.of, "to", file !== undefined);
      Reflect.set(opts, indicator.ind.of, file !== undefined);
    }
  }

  return opts as ModOptions;
}
