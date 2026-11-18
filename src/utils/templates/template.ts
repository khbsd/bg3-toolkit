import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { consoleWebviewLog } from "../../webview/console";
import { getConf } from "../config";
import { getModInfo, ModOption } from "../mod_info";
import { Handle, Uuid } from "../uuid_handle";
import { getDisplayLanguageName, getWorkspacePath, wvErrLog } from "../ws";
import { generateDds } from "./dds";

const templatesPath: string = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "src",
  "utils",
  "templates",
  "files",
);

export const linkPaths: string[] = [
  path.join("Generated", "Public"),
  "Mods",
  "Public",
];

export type OptionPrompt = {
  category: string;
  prompt: string;
};
const optionPrompts: OptionPrompt[] = [
  {
    category: ModOption[ModOption.assets],
    prompt: "will this mod add custom assets?",
  },
  {
    category: ModOption[ModOption.items],
    prompt: "will this mod add custom items?",
  },
  {
    category: ModOption[ModOption.scripting],
    prompt: "will this mod use script extender scripting?",
  },
  {
    category: ModOption[ModOption.symlinks],
    prompt: "will this mod use symlinks to hotload files?",
  },
];

const modFiles: TemplateFile[] = [
  {
    path: "Localization/${language}/${name}_Loca.xml",
    content: path.join(templatesPath, "loca_xml.txt"),
  },
  {
    path: "Mods/${name}/meta.lsx",
    content: path.join(templatesPath, "meta_lsx.txt"),
  },
];

const itemDds: TemplateDds[] = [
  { width: 380, path: "Public/Game/GUI/Assets/Tooltips/Icons/abilities.dds" },
  { width: 380, path: "Public/Game/GUI/Assets/Tooltips/ItemIcons/icons.dds" },
  {
    width: 144,
    path: "Public/Game/GUI/Assets/ControllerUIicons/skills_png/abilities.dds",
  },
  {
    width: 144,
    path: "Public/Game/GUI/Assets/ControllerUIicons/items_png/items.dds",
  },
  {
    width: 256,
    height: 64,
    path: "Public/${name}/Assets/Textures/Icons/${name}_Icons.dds",
  },
];
const itemFiles: TemplateFile[] = [
  {
    path: "Public/${name}/Content/UI/[PAK]_UI/_merged.lsx",
    content: path.join(templatesPath, "_merged_lsf.txt"),
  },
  {
    path: "Public/${name}/GUI/Icons_Items.lsx",
    content: path.join(templatesPath, "icons_items_lsx.txt"),
  },
  {
    path: "Public/${name}/RootTemplates/${name}.lsx",
    content: path.join(templatesPath, "root_template_lsf.txt"),
  },
  {
    path: "Public/${name}/Stats/Generated/Data/${name}_Stats.txt",
    content: "",
  },
  { path: "Public/${name}/Stats/Generated/TreasureTable.txt", content: "" },
];

const scriptFiles: TemplateFile[] = [
  {
    path: "Mods/${name}/ScriptExtender/Config.json",
    content: path.join(templatesPath, "config_json.txt"),
  },
  {
    path: "Mods/${name}/ScriptExtender/Lua/BootstrapClient.lua",
    content: "",
  },
  {
    path: "Mods/${name}/ScriptExtender/Lua/BootstrapServer.lua",
    content: "",
  },
  { path: "Mods/${name}/ScriptExtender/Lua/Server/${name}.lua", content: "" },
];

// TODO: change from string[] to TemplateFolder[]
const assetPaths: TemplateFolder[] = [
  { path: "Generated/Public/${name}/Assets/DDS" },
  { path: "Generated/Public/${name}/Assets/GR2" },
  { path: "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Materials" },
  { path: "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Meshes" },
  { path: "Public/${name}/Content/Assets/Characters/[PAK]_Armor/Textures" },
];

export interface TemplateFolder {
  path: string;
}

export class TemplateFolder {
  name?: string;
  path: string;
  stats?: fs.Stats | undefined = undefined;

  constructor(tf: TemplateFolder) {
    this.name = path.basename(tf.path);
    this.path = tf.path;
    try {
      this.stats = fs.statSync(this.path);
    } catch (err) {}
  }
}

export interface TemplateFile {
  path: string;
  content: string;
}

export class TemplateFile extends TemplateFolder {
  content: string;

  constructor(tf: TemplateFile) {
    super({ path: tf.path });
    this.content = tf.content ?? "";
  }
}

export interface TemplateDds {
  width: number;
  height?: number;
}

export class TemplateDds extends TemplateFolder {
  width: number;
  height?: number;
  constructor(td: TemplateDds) {
    super({ path: td.path });
    this.width = td.width;
    if (td.height === undefined) {
      this.height = this.width;
    }
  }
}

export type ModOptions = {
  name: string;
  author: string;
  wsPath?: string;
  assets?: boolean;
  items?: boolean;
  scripting?: boolean;
  modUuid?: string;
  iconUuid?: string;
  preexists?: boolean;
  symlinks?: boolean;
};

// TODO: if a metafile already exists, grab it and use it for these fields
// same for iconUuid
export class ModTemplate {
  // named this way so they align with the names of the placeholders

  // ModOptions:
  name: string;
  author: string;
  wsPath: string;
  assets?: boolean;
  items?: boolean;
  scripting?: boolean;
  modUuid?: string;
  iconUuid?: string;
  preexists?: boolean;
  symlinks?: boolean;

  initHandle: string;
  language: string;

  // latest version as of typing this, but is dynamically updated when calling
  // this.getSeVersion()
  seVersion: number = 33;

  modFiles: TemplateFile[];
  modImages: TemplateDds[];
  modPaths: TemplateFolder[];

  constructor(opts: ModOptions) {
    this.author = opts.author;
    this.name = opts.name;

    const uuid = new Uuid();
    const handle = new Handle();

    for (const attr of Object.keys(opts)) {
      const key = attr as keyof typeof opts;
      if (
        this.hasOwnProperty(key) &&
        opts[key] !== undefined &&
        this[key] === undefined
      ) {
        Reflect.set(this, key, opts[key]);
        consoleWebviewLog("set", key, "to", opts[key]);
      }
    }
    this.modUuid = this.modUuid ?? uuid.uuid;
    this.iconUuid = this.iconUuid ?? uuid.get();
    this.initHandle = handle.handle;
    this.language = getDisplayLanguageName().name;
    this.wsPath = opts?.wsPath ?? path.join(getWorkspacePath());

    this.modFiles = [];
    this.modImages = [];
    this.modPaths = [];
  }

  public format() {
    function _f(mt: ModTemplate, text: string): string {
      for (const attr of Object.keys(mt)) {
        const key = attr as keyof typeof mt;
        let val = mt[key];
        if (typeof val === "string" || typeof val === "number") {
          text = text.replaceAll("${" + key + "}", val.toString());
        }
      }

      return text;
    }

    function _resolveModPath(text: string, wsPath: string): string {
      if (!text.includes(wsPath)) {
        text = path.join(wsPath, text);
      }

      return text;
    }

    function _addFiles(mt: ModTemplate, files: TemplateFile[]) {
      for (let file of files) {
        file.path = _f(mt, _resolveModPath(file.path, mt.wsPath));

        if (file.content.length > 0 && !file.content.includes('"')) {
          file.content = _f(
            mt,
            fs.readFileSync(path.normalize(file.content)).toString(),
          );
        }

        let dup: boolean = false;
        for (let existingFile of mt.modFiles) {
          dup = existingFile.path === file.path;
          if (dup) {
            break;
          }
        }

        if (!dup) {
          mt.modFiles.push(new TemplateFile(file));
        }
      }
    }
    function _addDds(mt: ModTemplate, files: TemplateDds[]) {
      for (const image of files) {
        image.path = _f(mt, _resolveModPath(image.path, mt.wsPath));
        mt.modImages.push(new TemplateDds(image));
      }
    }
    function _addPaths(mt: ModTemplate, folders: TemplateFolder[]) {
      for (const folder of folders) {
        folder.path = _f(mt, _resolveModPath(folder.path, mt.wsPath));
        mt.modPaths.push(new TemplateFolder(folder));
      }
    }

    if (!this.preexists) {
      _addFiles(this, modFiles);
      console.log(this);
    }

    if (this.assets) {
      _addPaths(this, assetPaths);
    }
    if (this.items) {
      _addFiles(this, itemFiles);
      _addDds(this, itemDds);
    }
    if (this.scripting) {
      _addFiles(this, scriptFiles);
    }
  }

  public async getSeVersion() {
    try {
      let res: Response = await fetch(
        "https://api.github.com/repos/Norbyte/bg3se/releases/latest",
        { method: "GET" },
      );

      let gitData: string | any = await res.json();
      this.seVersion = Number(gitData.tag_name.slice(1));
      consoleWebviewLog("found latest bg3se version:", this.seVersion);
    } catch (err) {
      consoleWebviewLog(err);
    }
  }

  public build() {
    if (this.symlinks) {
      const gameDataPath = getConf().gameDataPath;
      if (gameDataPath) {
        for (const link of linkPaths) {
          const fullLinkPath = path.join(this.wsPath, link, this.name);
          const dataLinkPath = path.join(gameDataPath, link, this.name);
          const linkPath = path.dirname(fullLinkPath);
          const dataPath = path.dirname(dataLinkPath);

          fs.stat(dataPath, (err) => {
            if (err) {
              fs.mkdir(
                dataPath,
                {
                  recursive: true,
                },
                wvErrLog,
              );
            }
          });
          fs.stat(linkPath, (err) => {
            if (err) {
              fs.mkdir(
                linkPath,
                {
                  recursive: true,
                },
                wvErrLog,
              );
            }
          });

          fs.readlink(dataLinkPath, (err) => {
            if (err) {
              fs.symlink(fullLinkPath, dataLinkPath, "dir", wvErrLog);
            }
          });
        }
      } else {
        vscode.window.showErrorMessage(
          "make sure you set the game data path option in the extension settings !!",
        );
      }
    }

    for (const file of this.modFiles) {
      if (file.stats?.isFile()) {
        continue;
      }

      fs.mkdirSync(path.dirname(file.path), { recursive: true });
      fs.writeFileSync(file.path, file.content, { flag: "wx" });
    }

    for (const folder of this.modPaths) {
      if (folder.stats?.isDirectory()) {
        continue;
      }

      fs.mkdir(folder.path, { recursive: true }, wvErrLog);
    }

    for (const image of this.modImages) {
      generateDds(image);
    }
  }
}

export async function modOptPrompts(
  mo: ModOptions,
): Promise<ModOptions | undefined> {
  if (!mo.name) {
    mo.name =
      (await vscode.window.showInputBox({
        title: "mod name?",
      })) ?? "";
  }

  if (!mo.author) {
    mo.author =
      (await vscode.window.showInputBox({
        title: "author name?",
      })) ?? "";
  }

  if (!mo.name || !mo.author) {
    return undefined;
  }

  let q: string | undefined;
  for (const o of optionPrompts) {
    let key = o.category as keyof ModOptions;
    if (!mo[key]) {
      q = await vscode.window.showQuickPick(["yes", "no"], {
        title: o.category + "?",
        prompt: o.prompt,
      });
      Reflect.set(mo, key, q === "yes");
    }
  }

  return mo;
}

export async function makeModTemplate(): Promise<void> {
  if (getConf().reloadRemind) {
    vscode.window
      .showInformationMessage(
        "if youve already generated a mod template and are wanting to make a new mod template, id recommend reloading the window !!",
        { title: "reload" },
        { title: "nah" },
      )
      .then((val) => {
        if (val?.title === "reload") {
          vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      });
  }

  let modOpts: ModOptions | undefined = await getModInfo();

  if (
    modOpts.assets &&
    modOpts.scripting &&
    modOpts.items &&
    modOpts.preexists &&
    modOpts.symlinks
  ) {
    consoleWebviewLog("mod", modOpts.name, "is fully created!");
    vscode.window.showInformationMessage("mod fully created!");
    return;
  }

  modOpts = await modOptPrompts(modOpts);
  if (modOpts === undefined) {
    return;
  }

  let mt = new ModTemplate(modOpts);
  await mt.getSeVersion();
  mt.format();
  mt.build();
}
