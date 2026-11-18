import * as fs from "fs";
import * as path from "path";

import { consoleWebviewLog } from "../webview/console";
import { getConf } from "./config";
import { getModPath } from "./file";
import { LsFile } from "./ls-formats/formats";
import { ModOptions } from "./templates/template";
import { getWorkspacePath } from "./ws";

export enum ModOption {
  name,
  author,
  wsPath,
  assets,
  items,
  scripting,
  modUuid,
  iconUuid,
  preexists,
  symlinks,
}

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

export type ModIndicator = {
  name: string;
  re: RegExp[];
  of: string;
  type: string;
};

// add symlinks
export const indicatorFiles: ModIndicator[] = [
  {
    name: "meta.lsx",
    re: [NameRegex, AuthorRegex, ModUuidRegex],
    of: ModOption[ModOption.preexists],
    type: "file",
  },
  {
    name: "Icons_Items.lsx",
    re: [IconUuidRegex],
    of: ModOption[ModOption.items],
    type: "file",
  },
  {
    name: path.join("[PAK]_UI", "_merged.lsx"),
    re: [IconUuidRegex],
    of: ModOption[ModOption.items],
    type: "file",
  },
  {
    name: "Config.json",
    re: [],
    of: ModOption[ModOption.scripting],
    type: "file",
  },
  {
    name: "BootstrapClient.lua",
    re: [],
    of: ModOption[ModOption.scripting],
    type: "file",
  },
  {
    name: "BootstrapServer.lua",
    re: [],
    of: ModOption[ModOption.scripting],
    type: "file",
  },
  {
    name: "[PAK]_Armor",
    re: [],
    of: ModOption[ModOption.assets],
    type: "folder",
  },
  {
    name: path.join("Generated", "Public"),
    re: [],
    of: ModOption[ModOption.symlinks],
    type: "link",
  },
  {
    name: "Mods",
    re: [],
    of: ModOption[ModOption.symlinks],
    type: "link",
  },
  {
    name: "Public",
    re: [],
    of: ModOption[ModOption.symlinks],
    type: "link",
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
    symlinks: undefined,
  };
  consoleWebviewLog("checking for existing mod files && folders...");

  for (const indicator of indicatorFiles) {
    switch (indicator.type) {
      case "folder": {
        const dirExists: boolean = getModIndicatorDir(indicator.name);
        consoleWebviewLog(
          indicator.name,
          "folder found, marking as",
          dirExists,
        );

        Reflect.set(opts, indicator.of, dirExists);
        break;
      }

      default:
      case "file": {
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
          consoleWebviewLog(
            indicator.of,
            "found, marking as",
            file !== undefined,
          );
          Reflect.set(opts, indicator.of, file !== undefined);
        }
        break;
      }

      case "link": {
        const gameDataPath = getConf().gameDataPath;
        if (!gameDataPath) {
          break;
        }

        let exists: boolean = false;
        try {
          exists =
            fs.readlinkSync(path.join(gameDataPath, indicator.name, opts.name))
              .length > 0;
          if (Reflect.get(opts, indicator.of) === undefined) {
            Reflect.set(opts, indicator.of, exists);
          }
        } catch (err) {
          Reflect.set(opts, indicator.of, exists);
        }

        break;
      }
    }
  }
  return opts as ModOptions;
}
